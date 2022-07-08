import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, child, get, set, update } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

// express config
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// firebase config
const env = useRuntimeConfig();
const config = {
    apiKey: env.API_KEY,
    authDomain: `${env.PROJECT_ID}.firebaseapp.com`,
    projectId: env.PROJECT_ID,
    storageBucket: `${env.PROJECT_ID}.appspot.com`,
    messagingSenderId: env.SENDER_ID,
    appId: env.APP_ID
};
initializeApp(config);
const db = getDatabase();

// functions
const getRandomQuestions = async n => {
    let questions = [];
    await get(child(ref(db), `/question`)).then(snapshot => {
        snapshot.forEach(s => {
            questions.push(s.val());  
        });
        questions = questions.sort(() => Math.random() - Math.random()).slice(0, n);
    });
    return questions;
}

const join = async (roomId, username, uuid) => {
    await get(child(ref(db), `/room/${roomId}`)).then(async snapshot => {
        const data = snapshot.val();
        if(!("client" in data) || (!(username in data.client) && Object.keys(data.client).length < 2)){
            const defaultClientData = {
                username: username,
                uuid: uuid,
                self: "",
                partner: "",
                point: 0,
                status: ""
            };
            await set(ref(db, `/room/${roomId}/client/${uuid}`), defaultClientData);
        } else {
            throw "Room is busy.";
        }
    });
}

const compareAnswers = async (roomId) => {
    let result = "waiting";
    await get(child(ref(db), `/room/${roomId}`)).then(async snapshot => {
        const data = snapshot.val();
        const clients = Object.entries(data.client);
        if (clients[0][1].self !== "" && clients[1][1].self !== "" && clients[0][1].partner !== "" && clients[1][1].partner !== ""){
            const updates = {};

            if (clients[0][1].self.toLowerCase() === clients[1][1].partner.toLowerCase()) {
                updates[`/room/${roomId}/client/${clients[1][0]}/point`] = clients[1][1].point + 10;
                updates[`/room/${roomId}/client/${clients[1][0]}/status`] = "true";
            } else {
                updates[`/room/${roomId}/client/${clients[1][0]}/status`] = "false";
            }

            if (clients[1][1].self.toLowerCase() === clients[0][1].partner.toLowerCase()) {
                updates[`/room/${roomId}/client/${clients[0][0]}/point`] = clients[0][1].point + 10;
                updates[`/room/${roomId}/client/${clients[0][0]}/status`] = "true";
            } else {
                updates[`/room/${roomId}/client/${clients[0][0]}/status`] = "false";
            }

            // simple reset
            
            updates[`/room/${roomId}/question`] = await getRandomQuestions(1);
            updates[`/room/${roomId}/current`] = data.current + 1;
            updates[`/room/${roomId}/client/${clients[0][0]}/self`] = "";
            updates[`/room/${roomId}/client/${clients[0][0]}/partner`] = "";
            updates[`/room/${roomId}/client/${clients[1][0]}/self`] = "";
            updates[`/room/${roomId}/client/${clients[1][0]}/partner`] = "";
            await update(ref(db), updates);

            result = "success";
        }
        if (data.current === 5){
            result = "done";
        }
    });
    return result;
}

app.post("/create", async (req, res) => {
    try {
        const roomId = Math.floor(Math.random() * 1000000000); // generate random 9 digit ID
        const defaultRoomData = {
            uuid: uuidv4(),
            roomId: roomId,
            createdAt: new Date().toLocaleString(),
            userCreated: req.body.username,
            question: await getRandomQuestions(1),
            current: 1
        };
        set(ref(db, `/room/${roomId}`), defaultRoomData);
        const uuid = uuidv4();
        await join(roomId, req.body.username, uuid);
        res.status(200).json({ ...req.body, roomId: roomId, uuid: uuid });
    } catch (err) {
        res.status(404).json({ error: err });
    }
});

app.post("/join", async (req, res) => {
    try {
        const uuid = uuidv4();
        await join(req.body.roomId, req.body.username, uuid);
        res.status(200).json({ ...req.body, uuid: uuid });
    } catch (err) {
        res.status(404).json({ error: err });
    }
});

app.post("/submit-answer", async (req, res) => {
    try {
        let updates = {};
        updates[`/room/${req.body.roomId}/client/${req.body.uuid}/self`] = req.body.self;
        updates[`/room/${req.body.roomId}/client/${req.body.uuid}/partner`] = req.body.partner;
        await update(ref(db), updates);
        const s = await compareAnswers(req.body.roomId);
        res.status(200).json({ message: s });
    } catch (err) {
        res.status(404).json({ error: err });
    }
});


export default app;