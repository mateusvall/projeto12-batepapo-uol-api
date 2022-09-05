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

app.post("/messages", (req, res) =>{
    const userSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid('private_message','message').required(),

    }); 

    const user = {from: req.headers.user};
    const message = req.body;
    const validation = userSchema.validate(message, {abortEarly: true});

    if (validation.error) {
        console.log(validation.error.details[0].message)
        res.sendStatus(422);
    } else{
        db.collection("messages").findOne(user).then((useri) =>{
            if(useri){
                db.collection("messages").insertOne({
                    ...user,
                    ...message,
                    time: dayjs(Date.now()).format('hh:mm:ss')
                })
                res.sendStatus(201);
            }else{
                res.sendStatus(422);
            }
        })

    }
})

app.get("/messages", (req, res) =>{
    const limit = parseInt(req.query.limit);
    const user = req.headers.user;

    db.collection("messages").find({from: user}).toArray().then((messages) =>{
        if(limit){
            res.send(messages.slice(-limit));
        }
        else{
            res.send(messages)
        }
    })
})

app.post("/status", (req, res) =>{
    const user = req.headers.user;
    const now = Date.now();

    db.collection("users").findOne({name:user}).then((useri) =>{
        if(useri){
            console.log("Achou!");
            db.collection("users").updateOne({
                _id: useri._id
            },{$set: {...useri, lastStatus:now}});
            res.sendStatus(200);
        }
        else{
            res.sendStatus(404);
        }
    })
})

app.listen(5000);