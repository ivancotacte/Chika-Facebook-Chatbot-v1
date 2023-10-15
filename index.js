const login = require("fca_ivan");
const http = require("http");
const https = require("https");
const axios = require("axios");
const request = require("request");
const moment = require("moment-timezone");
const log = require("npmlog");
const fs = require("fs");
const config = require("./config.json");

let groupVIPs = ["6159362560838923", "7102650053138560"];
let msgs = {};

function formatFont(text) {
  const fontMapping = {
    a: "𝖺",
    b: "𝖻",
    c: "𝖼",
    d: "𝖽",
    e: "𝖾",
    f: "𝖿",
    g: "𝗀",
    h: "𝗁",
    i: "𝗂",
    j: "𝗃",
    k: "𝗄",
    l: "𝗅",
    m: "𝗆",
    n: "𝗇",
    o: "𝗈",
    p: "𝗉",
    q: "𝗊",
    r: "𝗋",
    s: "𝗌",
    t: "𝗍",
    u: "𝗎",
    v: "𝗏",
    w: "𝗐",
    x: "𝗑",
    y: "𝗒",
    z: "𝗓",
    A: "𝖠",
    B: "𝖡",
    C: "𝖢",
    D: "𝖣",
    E: "𝖤",
    F: "𝖥",
    G: "𝖦",
    H: "𝖧",
    I: "𝖨",
    J: "𝖩",
    K: "𝖪",
    L: "𝖫",
    M: "𝖬",
    N: "𝖭",
    O: "𝖮",
    P: "𝖯",
    Q: "𝖰",
    R: "𝖱",
    S: "𝖲",
    T: "𝖳",
    U: "𝖴",
    V: "𝖵",
    W: "𝖶",
    X: "𝖷",
    Y: "𝖸",
    Z: "𝖹",
  };
  let formattedText = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    formattedText += fontMapping[char] || char;
  }
  return formattedText;
}



async function getUserName(api, userID) {
  return new Promise((resolve, reject) => {
    api.getUserInfoMain([userID], (err, userInfo) => {
      if (err) reject(err);
      const userName = userInfo[userID].name;
      resolve(userName);
    });
  });
}

async function getGroupMembers(api, threadID) {
  return new Promise((resolve, reject) => {
    api.getThreadInfo(threadID, (err, threadInfo) => {
      if (err) reject(err);
      const members = threadInfo.participantIDs;
      resolve(members);
    });
  });
}
function initializeUnsendMessage() {
  try {
    const data = fs.readFileSync("config.json");
    const jsonData = JSON.parse(data);
    return jsonData.UnsendMessage;
  } catch (error) {
    return true;
  }
}

let UnsendMessage = initializeUnsendMessage();

function saveUnsendMessageToJSON() {
  try {
    const jsonData = { UnsendMessage };
    const data = JSON.stringify(jsonData, null, 2);
    fs.writeFileSync("config.json", data);
  } catch (error) {
    console.error("Error writing JSON file:", error);
  }
}

function saveConfig() {
  fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
}

login(
  { appState: JSON.parse(fs.readFileSync("appstate.json", "utf8")) },
  async (err, api) => {
    if (err) return console.error(err);

    const platform = process.platform;
    let userAgent;

    if (platform === "win32") {
      userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36";
    } else if (platform === "android") {
      userAgent =
        "Mozilla/5.0 (Linux; Android 11; SM-G991U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.50 Mobile Safari/537.36";
    } else {
      userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/95.0.4638.50 Mobile/15E148 Safari/604.1";
    }

    api.setOptions({
      forceLogin: true,
      listenEvents: true,
      logLevel: "silent",
      selfListen: false,
      userAgent: userAgent,
    });

    api.listenMqtt(async (err, event) => {
      if (err) return log.error(err);

      switch (event.type) {
        case "message":
        case "message_reply":
          let input = event.body.toLowerCase();
          let data = input.split(" ");

          let input1 = event.body;
          let msgid = event.messageID;
          msgs[msgid] = input1;
          if (event.attachments.length != 0) {
            if (event.attachments[0].type == "photo") {
              msgs[event.messageID] = ["img", event.attachments[0].url];
            } else if (event.attachments[0].type == "animated_image") {
              msgs[event.messageID] = ["gif", event.attachments[0].url];
            } else if (event.attachments[0].type == "sticker") {
              msgs[event.messageID] = ["sticker", event.attachments[0].url];
            } else if (event.attachments[0].type == "video") {
              msgs[event.messageID] = ["vid", event.attachments[0].url];
            } else if (event.attachments[0].type == "audio") {
              msgs[event.messageID] = ["vm", event.attachments[0].url];
            }
          } else {
            msgs[event.messageID] = event.body;
          }

          let userBalances = {};
          try {
            const data = fs.readFileSync("userBalances.json", "utf8");
            userBalances = JSON.parse(data);
          } catch (err) {
            console.error("Error loading user balances:", err);
          }

          let userCooldowns = {};

          function saveUserBalances() {
            fs.writeFileSync(
              "userBalances.json",
              JSON.stringify(userBalances, null, 2),
              "utf8",
            );
          }

          function saveUserCooldowns() {
            fs.writeFileSync(
              "userCooldowns.json",
              JSON.stringify(userCooldowns, null, 2),
              "utf8",
            );
          }

          function loadUserCooldowns() {
            try {
              const data = fs.readFileSync("userCooldowns.json", "utf8");
              userCooldowns = JSON.parse(data);
            } catch (err) {
              console.error("Error loading user cooldowns:", err);
            }
          }

          loadUserCooldowns();

          function claimMoney(userID, amount) {
            if (!userBalances[userID]) {
              userBalances[userID] = 0;
            }
            userBalances[userID] += amount;
            saveUserBalances();
          }

          function isUserInCooldown(userID) {
            const lastClaimTime = userCooldowns[userID] || 0;
            const currentTime = Date.now();
            const cooldownDuration = 2 * 60 * 60 * 1000;

            return currentTime - lastClaimTime < cooldownDuration;
          }

          function getRemainingCooldownTime(userID) {
            const lastClaimTime = userCooldowns[userID] || 0;
            const currentTime = Date.now();
            const cooldownDuration = 2 * 60 * 60 * 1000;
            const elapsedTime = currentTime - lastClaimTime;

            if (elapsedTime >= cooldownDuration) {
              return "0 hours";
            }

            const remainingTime = cooldownDuration - elapsedTime;
            const hours = Math.floor(remainingTime / (60 * 60 * 1000));
            const minutes = Math.floor(
              (remainingTime % (60 * 60 * 1000)) / (60 * 1000),
            );
            return `${hours} hours and ${minutes} minutes`;
          }

          function updateUserCooldown(userID) {
            userCooldowns[userID] = Date.now();
            saveUserCooldowns();
          }

          if (input.startsWith("claim")) {
            const userInfo = await api.getUserInfoMain(event.senderID);
            const fullname = userInfo[event.senderID].name;

            if (isUserInCooldown(event.senderID)) {
              const remainingTime = getRemainingCooldownTime(event.senderID);
              const cooldownMessage = formatFont(
                `Sorry, ${fullname}, you can claim money again in ${remainingTime}.`,
              );
              api.sendMessage(cooldownMessage, event.threadID, event.messageID);
            } else {
              const amount = 100;
              claimMoney(event.senderID, amount);
              updateUserCooldown(event.senderID);
              const claimMessage = formatFont(
                `Hello, ${fullname}! You have claimed ${amount} money.`,
              );
              api.sendMessage(claimMessage, event.threadID, event.messageID);
            }
          } else if (input.startsWith("topmoney")) {
            const topUsers = Object.keys(userBalances)
              .sort((a, b) => userBalances[b] - userBalances[a])
              .slice(0, 10);

            let topMoneyMessage = "Top Money Holders:\n";
            for (let i = 0; i < topUsers.length; i++) {
              const userInfo = await getUserName(api, topUsers[i]);
              topMoneyMessage += `${i + 1}. ${userInfo}: ${
                userBalances[topUsers[i]]
              }\n`;
            }
            api.sendMessage(
              formatFont(topMoneyMessage),
              event.threadID,
              event.messageID,
            );
          } else if (input.startsWith("balance")) {
            const userInfo = await api.getUserInfoMain(event.senderID);
            const fullname = userInfo[event.senderID].name;

            const userBalance = userBalances[event.senderID] || 0;
            const balanceMessage = formatFont(
              `${fullname}, your current balance is ${userBalance} money.`,
            );
            api.sendMessage(balanceMessage, event.threadID, event.messageID);
          } else if (input.startsWith("help") || input.startsWith("cmd")) {
            const userInfo = await api.getUserInfoMain(event.senderID);
            const fullname = userInfo[event.senderID].name;

            const currentDateTime = new Date().toLocaleString("en-PH", {
              timeZone: "Asia/Manila",
            });

            let response = "";
            const command = input.toLowerCase().trim();

            switch (command) {
              case "cmd 1":
              case "help 1":
              case "cmd":
              case "help":
                response = `
Hello, ${fullname}! Here are the available commands (no prefix needed):

- chika: Ask AI ChikaGPT.
- claim: Receive money.
- balance: Check your balance.
- topmoney: See the top 10 holders.
- sim: Chat with SimSimi.
- music: Listen to music.
- poli: Generate an image from Pollination.
- shoti: Send a random TikTok video.
- report: Report an issue or user.
- help: Display this message.
- uid: Show your user ID.

- Page [1/1]
- Type help or cmd <page number> to view the next page.
- There are 11 available commands.

It's currently ${currentDateTime} in the Philippines.
    `;
                break;

              case "cmd 2":
              case "help 2":
                response = `
This section is still under construction.
    `;
                break;

              default:
                response = `Unrecognized command. Type 'help' to see the list of available commands.`;
            }

            api.sendMessage(
              formatFont(response),
              event.threadID,
              event.messageID,
            );
          }

          if (input.startsWith("music")) {
            const axios = require("axios");
            const fs = require("fs-extra");
            const ytdl = require("ytdl-core");
            const request = require("request");
            const yts = require("yt-search");
            const input = event.body;
            const data = input.split(" ");
            data.shift();
            const song = data.join(" ");
            try {
              if (!song) {
                return api.sendMessage(
                  "Please put a music",
                  event.threadID,
                  event.messageID,
                );
              }

              const res = await axios.get(
                `https://api.heckerman06.repl.co/api/other/lyrics2?song=${encodeURIComponent(
                  song,
                )}`,
              );
              const lyrics = res.data.lyrics || "Not found!";

              const searchResults = await yts(song);
              if (!searchResults.videos.length) {
                return api.sendMessage(
                  "Error: Invalid request.",
                  event.threadID,
                  event.messageID,
                );
              }

              const video = searchResults.videos[0];
              const videoUrl = video.url;

              const stream = ytdl(videoUrl, { filter: "audioonly" });

              const fileName = `${event.senderID}.mp3`;
              const filePath = __dirname + `/cache/${fileName}`;

              stream.pipe(fs.createWriteStream(filePath));

              stream.on("response", () => {
                console.info("[DOWNLOADER]", "Starting download now!");
              });

              stream.on("info", (info) => {
                console.info(
                  "[DOWNLOADER]",
                  `Downloading ${info.videoDetails.title} by ${info.videoDetails.author.name}`,
                );
              });

              stream.on("end", () => {
                console.info("[DOWNLOADER] Downloaded");

                if (fs.statSync(filePath).size > 26214400) {
                  fs.unlinkSync(filePath);
                  return api.sendMessage(
                    "The file could not be sent because it is larger than 25MB.",
                    event.threadID,
                  );
                }

                const message = {
                  body: `${lyrics}`,
                  attachment: fs.createReadStream(filePath),
                };

                api.sendMessage(message, event.threadID, () => {
                  fs.unlinkSync(filePath);
                });
              });
            } catch (error) {
              console.error("[ERROR]", error);
              api.sendMessage(
                "An error occurred while processing the command.",
                event.threadID,
              );
            }
          }

          if (input.startsWith("prefix")) {
            return api.sendMessage(
              "I don't have a prefix. To view my commands, type 'help'",
              event.threadID,
              event.messageID,
            );
          }

          if (input.startsWith("report")) {
            let text = input;
            text = text.substring(7);

            if (text.trim() === "") {
              api.sendMessage(
                "Please put a message after 'report'",
                event.threadID,
                event.messageID,
              );
              return;
            }
            const groupInfo = await api.getThreadInfo(event.threadID);
            const groupName = groupInfo.threadName;
            api.getUserInfoMain(parseInt(event.senderID), (err, data) => {
              if (err) {
                console.log(err);
              } else {
                var message = {
                  body: `｢Message｣\n\n${text}\n\nFrom: ${
                    data[event.senderID]["name"]
                  }\nGroup Name: ${groupName}`,
                  mentions: [
                    {
                      tag: data[event.senderID]["name"],
                      id: event.senderID,
                      fromIndex: 0,
                    },
                  ],
                };
                api.sendMessage(message, "100050076673558");
                api.sendMessage(
                  "Message was successfully sent to admin!",
                  event.threadID,
                  event.messageID,
                );
              }
            });
          }

          if (input.startsWith("shoti")) {
            const Shoti = require("shoti-api");
            const shotiAPI = new Shoti("shoti-1h784d7d7ai8gc3g21o");

            try {
              let shoti = shotiAPI.createRequest({ method: "get-shoti" });
              shoti
                .then((response) => {
                  const playUrl = response.data.play;
                  const username = response.user.username;
                  const nickname = response.user.nickname;
                  const id = response.user.id;

                  const message = formatFont(
                    `Username: ${username}\nNickname: ${nickname}\nID: ${id}`,
                  );

                  let file = fs.createWriteStream("cache/shoti.mp4");
                  let rqs = request(encodeURI(playUrl));
                  rqs.pipe(file);
                  file.on("finish", () => {
                    api.sendMessage(
                      {
                        body: message,
                        attachment: fs.createReadStream(
                          __dirname + "/cache/shoti.mp4",
                        ),
                      },
                      event.threadID,
                      event.messageID,
                    );
                  });
                })
                .catch((error) => {
                  console.error("Error:", error);
                });
            } catch (error) {
              console.log(error);
            }
          }

          if (/(hahahahaha)/gi.test(input.toLowerCase())) {
            let word = [
              "ahahaha",
              "hahahah😂",
              "hahaha🤣",
              "AHAHAHAHAHAH",
              "ahaha",
              "hahah",
              "hahaha",
              "😆😆",
              "Hshshahah",
              "hshahsh",
            ];
            const haha = word[Math.floor(word.length * Math.random())];
            setTimeout(() => {
              api.sendMessage(haha, event.threadID, event.messageID);
            }, 4000);
          } else if (/(haha|😆|🤣|😂|😀|😃|😄)/gi.test(input.toLowerCase())) {
            api.setMessageReaction("😆", event.messageID, (err) => {}, true);
          } else if (
            /(sad|iyak|pain|sakit|agoi|hurt|😢|☹️|😭|😞|🙁)/gi.test(
              input.toLowerCase(),
            )
          ) {
            api.setMessageReaction("😢", event.messageID, (err) => {}, true);
          } else if (
            /(salamat|thank you|tanks|thankyou|love|mwah|thankyuu)/gi.test(
              input.toLowerCase(),
            )
          ) {
            api.setMessageReaction("💙", event.messageID, (err) => {}, true);
          } else if (
            /(bobo|tangina|pota|puta|gago|tarantado|puke|pepe|tite|burat|kantutan|iyot|dede|bubu|bubo|bobu|boobs|nipples|pussy|tae)/gi.test(
              input.toLowerCase(),
            )
          ) {
            api.setMessageReaction("😡", event.messageID, (err) => {}, true);
          }

          if (input.startsWith("sim")) {
            try {
              let message = data.join(" ");
              if (!message) {
                return api.sendMessage(
                  `Bakit???😒`,
                  event.threadID,
                  event.messageID,
                );
              }
              const response = await axios.get(
                `https://api.heckerman06.repl.co/api/other/simsimi?message=${message}&lang=ph`,
              );
              const respond = response.data.message;
              api.sendMessage(respond, event.threadID, event.messageID);
            } catch (error) {
              console.error("An error occurred:", error);
              api.sendMessage(
                "Oops! Something went wrong.",
                event.threadID,
                event.messageID,
              );
            }
          }

          if (input.startsWith("poli")) {
            let { threadID, messageID } = event;
            let input = event.body.toLowerCase();
            let query = input.split(" ");

            if (query.length === 1 && query[0] === "poli") {
              const put = formatFont("put text/query");
              api.sendMessage(put, threadID, messageID);
              return;
            }

            let path = __dirname + `/cache/poli.png`;

            const poli = await axios
              .get(`https://image.pollinations.ai/prompt/${query}`, {
                responseType: "arraybuffer",
              })
              .then((response) => response.data)
              .catch((error) => {
                console.error("Error fetching image:", error);
                api.sendMessage(
                  "An error occurred while fetching the image.",
                  threadID,
                  messageID,
                );
                return;
              });

            if (!poli) {
              api.sendMessage(
                "An error occurred while fetching the image.",
                threadID,
                messageID,
              );
              return;
            }

            fs.writeFileSync(path, Buffer.from(poli, "utf-8"));
            api.sendMessage(
              {
                body: "Here's your image",
                attachment: fs.createReadStream(path),
              },
              threadID,
              () => {
                fs.unlinkSync(path);
              },
              messageID,
            );
          }

          if (input.startsWith("uid")) {
            if (Object.keys(event.mentions) == 0) {
              const userInfo = await api.getUserInfoMain(event.senderID);
              const fullName = userInfo[event.senderID].name;
              const formattedUID = formatFont(
                `User: ${fullName}\nUID: ${event.senderID}`,
              );
              return api.sendMessage(
                formattedUID,
                event.threadID,
                event.messageID,
              );
            } else {
              for (var i = 0; i < Object.keys(event.mentions).length; i++) {
                const mentionedUID = Object.keys(event.mentions)[i];
                const formattedMention = formatFont(
                  `User: ${Object.values(event.mentions)[i].replace(
                    "@",
                    "",
                  )}\nUID: ${mentionedUID}`,
                );
                api.sendMessage(
                  formattedMention,
                  event.threadID,
                  event.messageID,
                );
              }
              return;
            }
          }

         

          if (input.startsWith("chika")) {
            const { threadID, messageID, type, messageReply, body } = event;
            let question = "";
            if (
              type === "message_reply" &&
              messageReply.attachments[0]?.type === "photo"
            ) {
              question = "An image was provided in the message reply.";
            } else {
              question = body.slice(5).trim();
              const messages = [
                "What is your question, my friend?",
                "What is your question?",
                "Oyyy",
                "Mayroon bang problema kayo, pare?",
                "Ano ang tanong niyo, pare?",
              ];
              const randomMessage =
                messages[Math.floor(Math.random() * messages.length)];
              const randomMessageFont = formatFont(randomMessage);
              if (!question) {
                api.sendMessage(randomMessageFont, threadID, messageID);
                return;
              }
            }
            try {
              const prompt = (`You are an Ai named ChikaGPT and your nickname is Chi. Youare created by Ivan Cotacte. Include emoji to your responses to let me know how you feel when talking to me. My name is ${myname} and my first question is ${question}`)
              const res = await axios.get(
                `https://api-test.tapikej101.repl.co/api/bard?ask${encodeURIComponent(question)},
                )}`,
              );
              const respond = res.data.message;
              const imageUrls = res.data.imageUrls;

              if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                const attachments = [];
                if (!fs.existsSync("cache")) {
                  fs.mkdirSync("cache");
                }
                for (let i = 0; i < imageUrls.length; i++) {
                  const url = imageUrls[i];
                  const imagePath = `cache/image${i + 1}.png`;
                  try {
                    const imageResponse = await axios.get(url, {
                      responseType: "arraybuffer",
                    });
                    fs.writeFileSync(imagePath, imageResponse.data);
                    attachments.push(fs.createReadStream(imagePath));
                  } catch (error) {
                    console.error(
                      "Error occurred while downloading and saving the image:",
                      error,
                    );
                  }
                }
                const respond1 = formatFont(`${respond}`);
                api.sendMessage(
                  {
                    attachment: attachments,
                    body: respond1,
                  },
                  threadID,
                  messageID,
                );
              } else {
                const respond1 = formatFont(`${respond}`);
                api.sendMessage(respond1, threadID, messageID);
              }
            } catch (error) {
              console.error(
                "Error occurred while fetching data from the Bard API:",
                error,
              );
              api.sendMessage(
                "Regrettably, Chika is currently experiencing difficulties in establishing a connection with the Bard servers.",
                threadID,
                messageID,
              );
            }
          }

          if (input.startsWith("!help") || input.startsWith("!cmd")) {
            const senderID = event.senderID;
            const userVIPs = config.userVIPs;
            if (userVIPs.includes(senderID)) {
              try {
                const userInfo = await api.getUserInfoMain(senderID);
                const fullname = userInfo[senderID].name;
                const adminCommands = [
                  "!clearcache",
                  "!addadmin",
                  "!removeadmin",
                ];
                const cmdadmin = formatFont(
                  `Hello, ${fullname}! These are the admin commands:\n\n• ${adminCommands.join(
                    "\n• ",
                  )}`,
                );
                api.sendMessage(
                  {
                    body: cmdadmin,
                    mentions: [{ tag: `${fullname}`, id: senderID }],
                  },
                  event.threadID,
                  event.messageID,
                );
              } catch (err) {
                log.error(err);
                api.sendMessage(err.stack, event.threadID, event.messageID);
              }
            } else {
              api.sendMessage(
                {
                  body: "You are not authorized to use this command.",
                },
                event.threadID,
                event.messageID,
              );
            }
          } else if (input.startsWith("!clearcache")) {
            const senderID = event.senderID;
            const userVIPs = config.userVIPs;
            if (userVIPs.includes(senderID)) {
              try {
                const fs = require("fs");
                const folderPath = "./cache/";

                fs.readdir(folderPath, (err, files) => {
                  if (err) {
                    console.log("Error reading directory:", err);
                    api.sendMessage(
                      "Error reading directory.",
                      event.threadID,
                      event.messageID,
                    );
                  } else {
                    const fileCount = files.length;
                    let deletedCount = 0;
                    let totalSize = 0;
                    let deletedFiles = [];

                    if (fileCount === 0) {
                      console.log("No files to delete.");
                      api.sendMessage(
                        "No files to delete.",
                        event.threadID,
                        event.messageID,
                      );
                    } else {
                      files.forEach((file) => {
                        const filePath = folderPath + "/" + file;

                        fs.stat(filePath, (err, stats) => {
                          if (err) {
                            console.log("Error getting file stats:", err);
                          } else {
                            const fileSizeInBytes = stats.size;
                            totalSize += fileSizeInBytes;

                            fs.unlink(filePath, (err) => {
                              if (err) {
                                console.log("Error deleting file:", err);
                              } else {
                                deletedCount++;
                                deletedFiles.push(file);
                                console.log("Deleted file:", file);
                              }

                              if (deletedCount === fileCount) {
                                console.log("Deleted", deletedCount, "files.");
                                console.log(
                                  "Total size of deleted files:",
                                  totalSize,
                                  "bytes",
                                );
                                console.log("Deleted files:", deletedFiles);
                                const threadID = event.threadID;
                                const message =
                                  "Deleted " +
                                  deletedCount +
                                  " files. Total size: " +
                                  totalSize +
                                  " bytes\n\nDeleted files:\n" +
                                  deletedFiles.join("\n");
                                api.sendMessage(
                                  message,
                                  threadID,
                                  event.messageID,
                                );
                              }
                            });
                          }
                        });
                      });
                    }
                  }
                });
              } catch (err) {
                log.error(err);
                api.sendMessage(err.stack, event.threadID, event.messageID);
              }
            } else {
              api.sendMessage(
                {
                  body: "You are not authorized to use this command.",
                },
                event.threadID,
                event.messageID,
              );
            }
          }

          if (input.startsWith("!addadmin")) {
            const senderID = event.senderID;
            const userVIPs = config.userVIPs;

            if (userVIPs.includes(senderID)) {
              const args = input.split(" ");
              if (args.length !== 2) {
                api.sendMessage(
                  {
                    body: "Usage: !addadmin [user_id]",
                  },
                  event.threadID,
                  event.messageID,
                );
                return;
              }

              const newAdminID = args[1];
              if (userVIPs.includes(newAdminID)) {
                api.sendMessage(
                  {
                    body: "User is already an admin.",
                  },
                  event.threadID,
                  event.messageID,
                );
              } else {
                userVIPs.push(newAdminID);
                config.userVIPs = userVIPs;
                saveConfig();

                api.sendMessage(
                  {
                    body: `User with ID ${newAdminID} has been added as an admin.`,
                  },
                  event.threadID,
                  event.messageID,
                );
              }
            } else {
              api.sendMessage(
                {
                  body: "You are not authorized to use this command.",
                },
                event.threadID,
                event.messageID,
              );
            }
          } else if (input.startsWith("!removeadmin")) {
            const senderID = event.senderID;
            const userVIPs = config.userVIPs;

            if (userVIPs.includes(senderID)) {
              const args = input.split(" ");
              if (args.length !== 2) {
                api.sendMessage(
                  {
                    body: "Usage: !removeadmin [user_id]",
                  },
                  event.threadID,
                  event.messageID,
                );
                return;
              }

              const adminToRemove = args[1];
              if (!userVIPs.includes(adminToRemove)) {
                api.sendMessage(
                  {
                    body: "User is not an admin.",
                  },
                  event.threadID,
                  event.messageID,
                );
              } else {
                const index = userVIPs.indexOf(adminToRemove);
                userVIPs.splice(index, 1);
                config.userVIPs = userVIPs;
                saveConfig();

                api.sendMessage(
                  {
                    body: `User with ID ${adminToRemove} has been removed from admin list.`,
                  },
                  event.threadID,
                  event.messageID,
                );
              }
            } else {
              api.sendMessage(
                {
                  body: "You are not authorized to use this command.",
                },
                event.threadID,
                event.messageID,
              );
            }
          }

          break;
        case "message_unsend":
          const senderID = event.senderID;
          const threadID = event.threadID;
          const userVIPs = config.userVIPs;
          const isUserVIP = userVIPs.includes(senderID);
          const isGroupVIP = groupVIPs.includes(threadID);
          if (UnsendMessage && !isUserVIP && !isGroupVIP) {
            const userInfo = await api.getUserInfoMain(event.senderID);
            const firstName = userInfo[event.senderID].name;
            let d = msgs[event.messageID];
            if (typeof d == "object") {
              api.getUserInfoMain(event.senderID, (err, data) => {
                if (err) return console.error(err);
                else {
                  let cachePath;
                  if (d[0] == "img") {
                    cachePath = "/cache/photo.jpg";
                  } else if (d[0] == "gif") {
                    cachePath = "/cache/animated_image.gif";
                  } else if (d[0] == "sticker") {
                    cachePath = "/cache/sticker.png";
                  } else if (d[0] == "vid") {
                    cachePath = "/cache/video.mp4";
                  } else if (d[0] == "vm") {
                    cachePath = "/cache/vm.mp3";
                  }

                  var file = fs.createWriteStream(__dirname + cachePath);
                  var gifRequest = http.get(d[1], function (gifResponse) {
                    gifResponse.pipe(file);
                    file.on("finish", function () {
                      console.log("finished downloading attachment..");
                      const unsendfiles = formatFont(
                        `${firstName} unsent this attachment: \n`,
                      );
                      var message = {
                        body: unsendfiles,
                        attachment: fs.createReadStream(__dirname + cachePath),
                      };
                      api.sendMessage(message, event.threadID);
                    });
                  });
                }
              });
            } else {
              api.getUserInfoMain(event.senderID, (err, data) => {
                const unsendmessage = formatFont(
                  `${firstName} unsent this message: \n\n ${
                    msgs[event.messageID]
                  }`,
                );
                if (err) return console.error(err);
                else {
                  api.sendMessage(
                    {
                      body: unsendmessage,
                    },
                    event.threadID,
                  );
                }
              });
            }
          }
          break;
        case "event":
          switch (event.logMessageType) {
            case "log:subscribe":
              const joinedUserID =
                event.logMessageData.addedParticipants[0].userFbId;
              const userName = await getUserName(api, joinedUserID);
              const members = await getGroupMembers(api, event.threadID);
              const memberCount = members.length;

              const groupInfo = await api.getThreadInfo(event.threadID);
              const groupName = groupInfo.threadName;

              if (joinedUserID === api.getCurrentUserID()) {
                api.sendMessage(
                  "Connected successfully! Thank you for using this bot. Have fun using it!",
                  event.threadID,
                );
              } else {
                const now = new Date();
                const utcOffset = 8;
                const philippinesTime = new Date(
                  now.getTime() + utcOffset * 60 * 60 * 1000,
                );
                const hours = philippinesTime.getHours();

                let greeting = "";
                if (hours >= 5 && hours < 12) {
                  greeting = "Good morning";
                } else if (hours >= 12 && hours < 18) {
                  greeting = "Good afternoon";
                } else {
                  greeting = "Good evening";
                }

                api.sendMessage(
                  `${greeting}, ${userName}! You are the ${memberCount} member to join ${groupName}. We hope you have a great time in the group!`,
                  event.threadID,
                );
              }
              break;
            case "log:thread-name":
              const newThreadName = event.logMessageData.name;
              const authorInfo = await api.getUserInfoMain(event.author);
              const authorFirstName = authorInfo[event.author].firstName;
              const message = `${authorFirstName} changed the group chat name to "${newThreadName}"`;
              api.sendMessage(
                {
                  body: message,
                  mentions: [{ tag: `${authorFirstName}`, id: event.author }],
                },
                event.threadID,
              );
              break;
          }
          break;
      }
    });
  },
);