const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { SerialPort } = require('serialport');
require('dotenv').config();
const { ReadlineParser } = require('@serialport/parser-readline')
const portNo = process.env.PORT || 5000;

// Express middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@smart-home.a4v8nby.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Serial communication with Arduino
const port = new SerialPort({
    path: 'COM4',
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false
});
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
parser.on('data', data => console.log('Received data from Arduino:', data));

// MongoDB collection for LED state and timestamp
const collection = client.db('Smart-Home').collection('ledstate');

// Express routes
app.post('/led/on', async (req, res) => {
    port.write('1');
    const ledState = req.body;
    const result = await collection.insertOne(ledState)
    res.send(result)
});

app.post('/led/off', async (req, res) => {
    port.write('0');
    const ledState = req.body;
    const result = await collection.insertOne(ledState)
    res.send(result)

});

app.get('/led/history', async (req, res) => {
    const ledStates = await collection.find({}).toArray();
    res.send(ledStates);
});
app.delete('/led/history/delete', async (req, res) => {
    
    const result = await collection.deleteMany({});
    res.send(result);

})
app.delete('/led/history/delete/:id', async (req, res) => {
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    const result = await collection.deleteOne(filter);
    res.send(result);

})

app.get('/', async (req, res) => {
    res.send('Smart Home server is running');
});

app.listen(portNo, () => console.log(`Smart Home running on ${portNo}`));
