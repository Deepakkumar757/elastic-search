import cors from "cors";
import express from "express";
import Client from "./elastic/index";

declare global {
  function log(...args: unknown[]): void;
}
Object.assign(global, {
  log: (...args) => {
    // eslint-disable-next-line no-console
    console.log(...args);
  },
});

const { insert, search, delete: deleteIndexData } = Client;

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;
app.get("/", async (req, res) => {
  const data = await search({ index: "fleetmatch-orders", ...req.query });
  const { body } = data;
  res.send(body.hits.hits);
});

app.post("/", async (req, res, next) => {
  try {
    const { index = "fleetmatch-orders", ...rest } = req.body;
    const result = await insert(index, rest);
    res.send({ result, success: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/", async (req, res, next) => {
  try {
    const { index = null, id = null, all = false } = req.query;
    let result;
    if (!all && index) result = await deleteIndexData({ id, index });
    if (all && index) result = await deleteIndexData({ index });
    return result ? res.send(result) : res.status(404).send("Invalid Input");
  } catch (error) {
    next(error);
  }
});

app.listen(port, () => global.log("Server Running on port " + port));
