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


//staff login = belum bisa
app.post("/login", async (req, res) => {
  const { passcode } = req.body;

  try {
    const passcodeSnapshot = await db.collection("staffpasscode").doc(passcode.toString()).get();

    if (passcodeSnapshot.exists) {
      res.status(200).json({ message: "Login Succes" });
    } else {
      res.status(401).json({ message: "Login Failed, passcode Not valid" });
    }
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ message: "Error Server Get Collection" });
  }
});


// Generate QR code
app.get("/generateQRCode/:ticketNumber", async (req, res) => {
  const ticketNumber = req.params.ticketNumber;

  try {
    const ticketRef = db.collection("tickets");
    const querySnapshot = await ticketRef.where("TicketNumber", "==", ticketNumber).get();

    if (querySnapshot.empty) {
      res.status(404).send("Ticket not found");
    } else {
      const ticketData = querySnapshot.docs[0].data();
      const {
        BookingTimestamp,
        CreatedDate,
        CustomerEmail,
        CustomerId,
        CustomerName,
        ExpiredTimestamp,
        IsUsed,
        OrderId,
        ProductId,
        ProductName,
        TicketNumber,
        VariantName,
        VariantType
      } = ticketData;

      const responseData = {
        BookingTimestamp,
        CreatedDate,
        CustomerEmail,
        CustomerId,
        CustomerName,
        ExpiredTimestamp,
        IsUsed,
        OrderId,
        ProductId,
        ProductName,
        TicketNumber,
        VariantName,
        VariantType
      };

      res.json(responseData);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving ticket data");
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

    const validateQuery = await db.collection("ticketsvalidate").where("TicketNumber", "==", qrData.TicketNumber).get();

    if (validateQuery.empty) {
      const validateData = {
        Status: "Active",
        ScanTimestamp: new Date(),
        VisitorCount: 1, 
        ...validatedTicket,
      };
      await db.collection("ticketsvalidate").add(validateData);
    } else {
      const validateDoc = validateQuery.docs[0];
      const validateData = validateDoc.data();
      validateData.VisitorCount += 1;
      await validateDoc.ref.update(validateData);
    }

    res.json(validateData);
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
