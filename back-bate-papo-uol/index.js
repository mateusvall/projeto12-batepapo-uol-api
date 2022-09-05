import express from 'express'
import dotenv from "dotenv"
import cors from 'cors'
import dayjs from 'dayjs';
import { MongoClient } from 'mongodb';
import joi from 'joi'

dotenv.config();
const app = express();
app.use(cors())
app.use(express.json())
const mongoClient = new MongoClient("mongodb://localhost:27017")
let db;
mongoClient.connect().then(() =>{
    db = mongoClient.db();
})

app.post("/participants", (req, res) =>{
    const user = req.body;
    const userSchema = joi.object({
        name: joi.string().required(),
    }); 
    const validation = userSchema.validate(user, {abortEarly: true});

    if (validation.error) {
        console.log(validation.error.details[0].message)
        res.sendStatus(422);
    } else{
        db.collection("users").findOne(user).then((useri) => {
            if(useri){
                console.log("Nome não disponível!");
                res.sendStatus(409);
            }else{
                console.log("Nome disponível!");
                const now = Date.now();
                db.collection("users").insertOne({
                    name: user.name,
                    lastStatus: now
                })

                db.collection("messages").insertOne({
                    from: user.name,
                    to: 'Todos',
                    text: 'entra na sala...',
                    type: 'status',
                    time: dayjs(now).format('hh:mm:ss')
                })

                res.sendStatus(201);
            }
        })
    }

    
})

app.get("/participants", (req, res) =>{
    db.collection("users").find().toArray().then(users => {
        res.send(users)
    });
})

app.listen(5000);