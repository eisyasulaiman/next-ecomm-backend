import express from "express"
import prisma from "./src/utils/prisma.js"

const app = express()
const port = process.env.PORT || 8080



app.listen(port, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT ${port}");
});