const admin = require("firebase-admin");
const { createCanvas } = require("canvas");
const qrcode = require("qrcode");

const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

// Generate QR code
app.get("/generateQRCode/:ticketNumber", async (req, res) => {
  const ticketNumber = req.params.ticketNumber;

  const ticketRef = db.collection("tickets").where("TicketNumber", "==", ticketNumber);
  const querySnapshot = await ticketRef.get();

  if (querySnapshot.empty) {
    res.status(404).send("Ticket not found");
  } else {
    const ticketData = querySnapshot.docs[0].data();
    const qrData = JSON.stringify(ticketData);

    const canvas = createCanvas(200, 200);
    qrcode.toCanvas(canvas, qrData, (error) => {
      if (error) {
        console.error(error);
        res.status(500).send("Error generating QR code");
      } else {
        const stream = canvas.createPNGStream();
        res.type("png");
        stream.pipe(res);
      }
    });
  }
});

// Endpoint QR code
app.post("/validateQRCode", async (req, res) => {
  const { qrData } = req.body;

  const ticketData = await db.collection("tickets").where("TicketNumber", "==", qrData.TicketNumber).get();
  if (ticketData.empty) {
    res.status(404).send("Ticket not found");
  } else {
    const validatedTicket = ticketData.docs[0].data();
    
    const validateData = {
      Status: "Active",
      ScanTimestamp: new Date(), 
      VisitorCount: 1, 
      ...validatedTicket, 
    };

    await db.collection("ticketsvalidate").add(validateData);

    res.json(validateData);
  }
});

  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
