const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
var nodemailer = require("nodemailer");

app.use(express.json());
app.use(cors());

const uri = process.env.URI;
console.log(uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Collection
const Users = client.db("Edumanage").collection("users");
const support = client.db("Edumanage").collection("support");
const careers = client.db("Edumanage").collection("careers");

async function run() {
  try {
    await client.connect();
    console.log("Database Connect Successful");
  } catch (error) {
    console.log(error.message);
  }
}
run();

app.get("/", async (req, res) => {
  res.send("Done");
});

app.get("/careers", async (req, res) => {
  const query = {};
  const result = await careers.find(query).toArray();
  res.send(result);
});

app.get("/jobdetails/:id", async (req, res) => {
  const joblistItem = req.params.id;
  console.log(joblistItem);
  const query = { _id: ObjectId(joblistItem) };
  const result = await careers.findOne(query);
  res.send(result);
});
// app.get("/jobdetails", async (req, res) => {
//   const joblistItem = req.params.id;
//   console.log(joblistItem);
//   const query = {};

//   const myJobDetails = await joblist.find(query).toArray();
//   const jobMainDetails = { jobtag: 11 };
//   const JobDetails = await joblist.find(query).toArray();
//   myJobDetails.forEach((detail) => {
//     const jobtest = JobDetails.map((oneJob) => oneJob.job);
//     console.log(jobtest);
//     detail = jobtest;
//   });
//   res.send(JobDetails);
// });

//Job add Area

app.post("/addjob", async (req, res) => {
  try {
    const datajob = req.body;
    const result = await careers.insertOne(datajob);
    res.send({
      data: result,
      success: true,
      message: "Added New job Successful",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to Added New job",
    });
  }
});

// Create Jwt Token
app.post("/createJwtToken", (req, res) => {
  try {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "30d",
    });
    res.send({
      data: token,
      success: true,
      message: "JWT Token Generate Successful",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "JWT Token Generate Successful",
    });
  }
});

// get email

app.get("/support", async (req, res) => {
  const query = {};
  const result = await support.find(query).toArray();
  res.send(result);
});
// get email

app.get("/support/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const result = await support.findOne(query);
  res.send(result);
});
// get email

app.put("/support/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const options = { upsert: true };
  // create a document that sets the plot of the movie
  const data = req.body;
  const update = {
    $set: {
      time: data.time,
      meetLink: data.meetLink,
      guideEmail: data.guideEmail,
    },
  };
  const result = await support.updateOne(filter, update, options);
  res.send(result);
  // sent email
  const studentData = await support.findOne(filter);
  const {
    hostEmail,
    guideEmail,
    date,
    time,
    meetingCategory,
    meetingDescription,
  } = studentData;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.Email_SEND_EMAIL,
      pass: process.env.Email_SEND_PASS,
    },
  });

  const mailOptions = {
    from: "quselena0@gmail.com",
    to: hostEmail,
    cc: guideEmail,
    subject: `Your Meeting Schedule is ${meetingCategory}`,
    html: `
    <div>
    <h3>Your supporting is ${meetingCategory} on the ${date} at ${time}</h3>
    <P><bold>Invitee Email:</bold> ${hostEmail}</P>
    <p>${meetingDescription}</p>
    <span>Thanks from EduManage</span>
    </div>
    `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: success");
    }
  });
});

// send email
app.post("/support", async (req, res) => {
  const booking = req.body;
  const { hostEmail, meetingCategory, meetingDescription, date, time } =
    booking;

  const result = await support.insertOne(booking);

  // email send

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.Email_SEND_EMAIL,
      pass: process.env.Email_SEND_PASS,
    },
  });

  const mailOptions = {
    from: hostEmail,
    to: "sa8973634@gmail.com",
    subject: `Your Meeting Schedule is ${meetingCategory}`,
    html: `
    <div>
    <h3>Your supporting is ${meetingCategory} on the ${date} at ${time}</h3>
    <P><bold>Invitee Email:</bold> ${hostEmail}</P>
    <p>${meetingDescription}</p>
    <span>Thanks from EduManage</span>
    </div>
    `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: success");
    }
  });

  res.send(result);
});

// Verify JWT Token
function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized" });
  }
  const token = authHeader;

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ massage: "unauthorized" });
    }

    req.decoded = decoded;
    next();
  });
}

// Save User Info & Generate JWT Token
app.put("/users/:email", async (req, res) => {
  try {
    const user = req.body;
    const email = req.params.email;
    const filter = { email: email };
    const option = { upsert: true };
    const updateDoc = {
      $set: user,
    };
    const result = await Users.updateOne(filter, updateDoc, option);

    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "30d",
    });
    res.send({
      data: result,
      token: token,
      success: true,
      message: "Successfully Created User",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Account Created Fail! Please try again",
    });
  }
});

// Get All User Data
app.get("/users", async (req, res) => {
  try {
    const query = {};
    const result = await Users.find({}).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all users data",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Data Load Fail!",
    });
  }
});

// Added New Students
app.post("/students", async (req, res) => {
  try {
    const student = req.body;
    const result = await Students.insertOne(student);
    res.send({
      data: result,
      success: true,
      message: "Created New Student Data Successful",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Created Student Data Fail",
    });
  }
});

// Update Students Data
app.put("/students/:id", async (req, res) => {
  try {
    const parent = req.body;
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const option = { upsert: true };
    const updateDoc = {
      $set: parent,
    };
    const result = await Students.updateOne(filter, updateDoc, option);
    res.send({
      data: result,
      success: true,
      message: "Update Student Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail Update Student!",
    });
  }
});

// Get All Students Data
app.get("/students", async (req, res) => {
  try {
    const query = {};
    const result = await Students.find(query).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Students data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Find Students Data By Id
app.get("/students/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await Students.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: "Find Student Data Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to find Student data!",
    });
  }
});

// Delete Students Data By Id
app.delete("/students/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await Students.deleteOne(filter);
    res.send({
      data: result,
      success: true,
      message: "Delete Student Data Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to Delete Student data!",
    });
  }
});

// Added New Teachers
app.post("/teachers", async (req, res) => {
  try {
    const teacher = req.body;
    const result = await Teachers.insertOne(teacher);
    res.send({
      data: result,
      success: true,
      message: "Added New Teacher Successful",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to Added New Teacher",
    });
  }
});

// Update Teachers Data
app.put("/teachers/:id", async (req, res) => {
  try {
    const teacher = req.body;
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const option = { upsert: true };
    const updateDoc = {
      $set: teacher,
    };
    const result = await Teachers.updateOne(filter, updateDoc, option);
    res.send({
      data: result,
      success: true,
      message: "Update Teacher Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail Update Teacher!",
    });
  }
});

// Get All Teachers Data
app.get("/teachers", async (req, res) => {
  try {
    const query = {};
    const result = await Teachers.find(query).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Teachers data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Find Teacher Data By Id
app.get("/teachers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await Teachers.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: "Find Teacher Data Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to find Teacher data!",
    });
  }
});

// Delete Teacher Data By Id
app.delete("/teachers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await Teachers.deleteOne(filter);
    res.send({
      data: result,
      success: true,
      message: "Delete Teacher Data Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to Delete Teacher data!",
    });
  }
});

// Added New Parents
app.post("/parents", async (req, res) => {
  try {
    const teacher = req.body;
    const result = await Parents.insertOne(teacher);
    res.send({
      data: result,
      success: true,
      message: "Added New Parents Successful",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to Added New Teacher",
    });
  }
});

// Update Parents Data
app.put("/parents/:id", async (req, res) => {
  try {
    const parent = req.body;
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const option = { upsert: true };
    const updateDoc = {
      $set: parent,
    };
    const result = await Parents.updateOne(filter, updateDoc, option);
    res.send({
      data: result,
      success: true,
      message: "Update Parent Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail Update Parent!",
    });
  }
});

// Find Parents Data By Id
app.get("/parents/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await Parents.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: "Find Parent Data Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to find Parent data!",
    });
  }
});

// Delete Parents Data By Id
app.delete("/parents/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await Parents.deleteOne(filter);
    res.send({
      data: result,
      success: true,
      message: "Delete Parent Data Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to Delete Parent data!",
    });
  }
});

// Get All Parents Data
app.get("/parents", async (req, res) => {
  try {
    const query = {};
    const result = await Parents.find(query).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Parents data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Added New Classes
app.post("/classes", async (req, res) => {
  try {
    const classes = req.body;
    const result = await Classes.insertOne(classes);
    res.send({
      data: result,
      success: true,
      message: "Added New Classes Successful",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to Added New Classes",
    });
  }
});

// Find Classes Data By Id
app.get("/classes/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await Classes.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: "Find Classes Data Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to find Classes data!",
    });
  }
});

// Get All Classes Data
app.get("/classes", async (req, res) => {
  try {
    const query = {};
    const result = await Classes.find(query).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Classes data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Update Classes Data
app.put("/classes/:id", async (req, res) => {
  try {
    const classesBody = req.body;
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const option = { upsert: true };
    const updateDoc = {
      $set: classesBody,
    };
    const result = await Classes.updateOne(filter, updateDoc, option);
    res.send({
      data: result,
      success: true,
      message: "Update Classes Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail Update Classes!",
    });
  }
});

// Delete Classes Data By Id
app.delete("/classes/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await Classes.deleteOne(filter);
    res.send({
      data: result,
      success: true,
      message: "Delete Classes Data Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to Delete Classes data!",
    });
  }
});

// Added New Book
app.post("/books", async (req, res) => {
  try {
    const book = req.body;
    const result = await Books.insertOne(book);
    res.send({
      data: result,
      success: true,
      message: "Added New Book Successful",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to Added New Book",
    });
  }
});

// Find Book Data By Id
app.get("/books/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await Books.find(filter).toArray();
    res.send({
      data: result,
      success: true,
      message: "Find Book Data Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to find Book data!",
    });
  }
});
// Get All Books Data
app.get("/books", async (req, res) => {
  try {
    const query = {};
    const result = await Books.find(query).toArray();
    res.send({
      data: result,
      success: true,
      message: "Successfully find the all Books data",
    });
  } catch (error) {
    res.send({
      data: error,
      success: false,
      message: "Data Load Fail",
    });
  }
});

// Update Books Data
app.put("/books/:id", async (req, res) => {
  try {
    const book = req.body;
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const option = { upsert: true };
    const updateDoc = {
      $set: book,
    };
    const result = await Books.updateOne(filter, updateDoc, option);
    res.send({
      data: result,
      success: true,
      message: "Update Books Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail To Update Books!",
    });
  }
});

// Delete Books Data By Id
app.delete("/books/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await Books.deleteOne(filter);
    res.send({
      data: result,
      success: true,
      message: "Delete Book Data Successfully!",
    });
  } catch (error) {
    res.send({
      data: error.message,
      success: false,
      message: "Fail to Delete Book data!",
    });
  }
});

app.listen(port || 5000, () => {
  console.log("Server Running SuccessFull Port", port);
});
