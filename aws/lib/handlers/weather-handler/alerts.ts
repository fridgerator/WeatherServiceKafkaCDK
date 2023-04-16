import * as FeedParser from "feedparser";
import axios from "axios";
import * as stringToStream from "string-to-stream";
import { Alert } from "../../../utils/alert";
import { ALERTS_ATOM_URL } from "../../../utils/index";

export const getAlerts = (debug: boolean = false): Promise<Alert[]> => {
  const feedParser = new FeedParser({});
  const posts: Alert[] = [];

  return new Promise((resolve, reject) => {
    axios
      .get(ALERTS_ATOM_URL)
      .then((res) => {
        if (res.status !== 200) return reject("Request was not successful");
        return stringToStream(res.data).pipe(feedParser);
      })
      .then(() => {
        feedParser.on("error", (e: any) => {
          reject(e);
        });
        feedParser.on("end", () => {
          if (debug) console.log("posts : ", posts.length);
          resolve(posts);
        });
        feedParser.on("readable", function () {
          let post: Alert;
          // @ts-ignore
          while ((post = this.read())) {
            posts.push(post);
          }
        });
      })
      .catch((e) => {
        reject(e);
      });
  });
};
