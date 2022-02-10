import express from "express"
import fs from "fs"
import fsp from "fs/promises"
import archiver from "archiver"
import multer from "multer"
import AdmZip from "adm-zip"

const PORT = 3000
const SERVER = express()
const UPLOAD = multer()

SERVER.set("view engine", "hbs")

SERVER.use(express.static(`${__dirname}/site`)) //rende i file nella directory /site raggiungibili staticamente
SERVER.use("/flowbite.js", express.static(`${__dirname}/node_modules/flowbite/dist/flowbite.js`)) //rende flowbite.js raggiungibile sulla route /flowbite.js

//URL pagina progetti
SERVER.get("/progetti", async (req, res) => {

    //legge i nomi delle cartelle e li passa al template per poterli inserire nelle card
    let userNames: string[] = (await fsp.readdir("./progetti")).filter((element) => {
        return fs.lstatSync(`./progetti/${element}`).isDirectory() //elimina dall'array file che non siano directory
    })

    res.render("progetti", {userNames: userNames})
})

//URL di download file
SERVER.get("/download", (req, res) => {

    let archive = archiver("zip")
    archive.on("error", (error) => {
        //errore nel mandare la riorsa richiesta, avvisa il client
        res.status(500).send(`Internal server error: ${error.message}`)
        console.log(`Errore in invio progetto: ${error.message}`)
    })

    let userName = req.query.user //il nome dell'utente contenuto nella query

    //se l'utente ha già un progetto, restituisco quello
    if(fs.existsSync(`./progetti/${userName}`)) {

        res.attachment(`${userName}.zip`) //nome dell'allegato mandato
        //aggiunge la cartella ad uno zip e la manda al client (res.write è implicito dato che archiver si "attacca" all'output di res)
        archive.pipe(res)
        archive.directory(`./progetti/${userName}`, `${userName}`)
        archive.finalize()

        console.log(`Inviato progetto ${userName}.zip a ${req.ip}`)
        return
    }

    //altrimenti, restituisco il progetto di default
    let file = fs.readFileSync(`./progetti/import.zip`)
    res.attachment(`${userName || "import"}.zip`)
    res.write(file)
    res.end()

    console.log(`Inviato progetto di default con nome ${userName || "import"}.zip a ${req.ip}`)
})

//URL per caricare progetti
SERVER.post("/upload", UPLOAD.single("project"), (req, res) => {
    
    let file = req.file //il file allegato
    let userName = req.query.user //il nome dell'utente contenuto nella query

    //controlli che il file allegato e l'utente siano validi
    if(file === undefined) {
        res.status(400).send("Nessun file allegato.")
        return
    }
    if(!file.originalname.endsWith(".zip")) {
        res.status(400).send("Il file allegato non è un archivio .zip.")
        return
    }
    if(userName === undefined) {
        res.status(400).send("Nessun nome utente passato.")
        return
    }

    let zip = new AdmZip(file!.buffer)
    //controlla se l'archivio contiene dentro direttamente i file o la cartella del progetto, poi lo estrae nella posizione giusta
    if(zip.getEntry(userName as string) === null) {
        zip.extractAllTo(`./progetti/${userName}`, true)
    } else {
        zip.extractAllTo("./progetti/", true)
    }

    res.send("Progetto caricato!")
    res.end()

    console.log(`Caricato progetto inviato dall'utente ${userName} da ${req.ip}`)
})

//ascolta per connessioni
SERVER.listen(PORT, () => {
    console.log(`Started http://localhost:${PORT}`)
})