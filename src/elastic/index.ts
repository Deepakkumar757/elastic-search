import { Client } from "@elastic/elasticsearch";
import config from "config";

const { url, username, password }: Record<string, string> =
  config.get("elastic");

class ElasticSearch {
  client: Client;
  constructor() {
    this.createConnection();
    this.insert = this.insert.bind(this);
    this.search = this.search.bind(this);
    this.delete = this.delete.bind(this);
    this.Client = this.Client.bind(this);
    this.bulk = this.bulk.bind(this);
  }

  Client() {
    return this.client;
  }
  async createConnection() {
    try {
      const instance = new Client({ node: url, auth: { username, password } });
      const ping = await instance.ping({});
      if (ping.statusCode !== 200)
        throw Error("Elasticsearch Cluster Not Reachable");
      global.log("Elasticsearch Cluster Connected");
      this.client = instance;
    } catch (error) {
      global.log("Error - ElasticSearch -> createConnection", error);
    }
  }
  async insert(index: string, data: object = {}) {
    try {
      return await this.client.index({ index, body: data });
    } catch (error) {
      throw Error(error);
    }
  }

  async bulk(index:string, data: object[]) {
    try {
      const result = [];
      for (const obj of data) {
        result.push(await this.insert(index, obj));
      }
      return result;
    } catch (error) {
      throw Error(error);
    }
  }

  async search({ index = "fleetmatch-orders", ...params }) {
    try {
      return await this.client.search({
        index,
        body: {
          query: {
            bool: {
              must: Object.keys(params).map((key) => ({
                 /** 
                  *  search the exact value 
                **/ 
                // term: { [key]: params[key] }

                /** 
                 * It return the records which match the searchValue 
                **/
                match: {[key]: params[key] },

                /**
                 *  It return the records which almost match the searchvalue 
                 **/
                // fuzzy: { [key]: params[key] }, // it accept the most matching records

                /**
                 * Its a method to add multiple search options in one 
                **/
                // multi_match: {
                //   query: params[key],
                //   fields:[key],
                //   fuzziness:1
                // }
              })),
            },
          },
        },
      });
    } catch (error) {
      throw Error(error);
    }
  }
  async delete(params) {
    return await this.client.delete(params);
  }
}

export default new ElasticSearch();
