import express from "express";
import mongoose from "mongoose";
import Pusher from "pusher";
import cors from "cors";

// importing the message model
import Message from "./model/Message.js"

// app conf & port
const app = express();
const port = process.env.PORT || 8800;

// middle wares
// app.use((req,res,next)=>{
//     res.setHeader("Access-Control-Allow-Origin","*");
//     res.setHeader("Access-Control-Allow-Headers","*");
//     next();
// })
app.use(cors());


// pusher config

const pusher = new Pusher({
  appId: "1250386",
  key: "34f8dcaad3e2807dc440",
  secret: "f53025eb9a53162dffb9",
  cluster: "ap2",
  useTLS: true
});

// adding the change stream
const db = mongoose.connection;
db.once("open", ()=>{
    console.log("db is opened...");
    
    const messageCollection = db.collection("mesagecontents");
    const changeStream = messageCollection.watch();
    // console.log(changeStream);
    // on change
    changeStream.on("change", (change)=>{
        // console.log("chang...e", change);
        // and after change... if the operation type is insert then... its time to trigger the pusher
        if(change.operationType === "insert"){
            const messageInfo = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageInfo.name,
                message : messageInfo.message,
                timestamp : messageInfo.timestamp,
                received: messageInfo.received,
            })
        }else{
            console.log("pusher isnt triggered");
        }

    });
});

// json
app.use(express.json());

// mongodb connection using tthe mongoose
const mongo_url = "mongodb+srv://mongodb-pass:mongodb-pass@cluster0.lerv3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"

mongoose.connect(mongo_url, {
    useCreateIndex:true,
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(console.log("db connected"));

// api routes
app.get('/', (req,res)=>res.status(200).send("hello"));

app.post("/api/wp/messages/new", async(req,res)=>{
    const dbMesage = new Message(req.body);

    try{
        const savedMessage = await dbMesage.save();
        res.status(201).send(savedMessage);
    }catch(err){
        res.status(500).send(err);
    }
})

app.get("/api/wp/messages/find", (req,res)=>{
    Message.find((err, data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    })
})

// listening
app.listen(port , ()=> console.log("listening at "+ port));