// 仕様:
// ・取得した現在時刻から-5分の時刻を取得
// ・Queryに設定してTweetがあるかチェック→あればdiscordに飛ばす
// ・GASの起動は5分ごとに設定

// ■ memo
// ・時間について
// ISO8603
// const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss'Z'");

// ■ 参考にしたサイト
// ・リクエスト関連のヒント
// https://zenn.dev/specially198/articles/54d0b957f185b8
// ・discord投稿関連
// https://qiita.com/Eai/items/1165d08dce9f183eac74

/**
 * 定数
 */
const now = new Date()
const twitterEndpoint = "https://api.twitter.com/2/tweets/search/recent?query=from:";
// TODO: ↓↓自分の情報を記載する↓↓
// -- Twitter --
const twitterUserIds = ["user1", "user2", "user3"]
const bearerToken = '[発行したToken]'
// -- Discord --
const discordWebhookUrl = "[discord-webhook-url]";

/**
 * range_start: 現在時刻から6分前の時刻を取得する
 */
function getStartTimeStr() {
  // -1(1分前)だと、Tweetした直後に実行しても取得出来ない。ので5分間隔で-6分前からのデータを取るようにする
  const oneMinuteAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()-6, now.getSeconds())
  const str = Utilities.formatDate(oneMinuteAgo, 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");
  Logger.log(str)
  return str;
}

/**
 * range_end: 現在時刻から10秒前の時刻を取得する
 */
function getEndTimeStr() {
  // 10秒前からじゃないとダメみたい
  const tenSecondsAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()-10)
  const str = Utilities.formatDate(tenSecondsAgo, 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'")
  Logger.log(str)
  return str
}

/**
 * Discordへの通知処理
 */
function sendToDiscord(userId, tweetId) {
  const url = 'https://twitter.com/'+ userId + '/status/';
  const content = "新しい投稿だよ！\r" + url + tweetId
  const payload = {
    username: "91TwitterBot",
    avatar_url: "https://avatars.githubusercontent.com/u/82193137?v=4",
    content: content,
  };
  UrlFetchApp.fetch(discordWebhookUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
  });
}

/**
 * メイン
 */
function main() {
  const startTime = '&start_time=' + getStartTimeStr()
  const endTime = '&end_time=' + getEndTimeStr()
  for (const userId of twitterUserIds) {
    // retweetも対象外としたい場合は-is:retweetフラグをつける
    // const url = twitterEndpoint + userId + " -is:retweet" + " -is:reply" + startTime + endTime
    const url = twitterEndpoint + userId + " -is:reply" + startTime + endTime
    Logger.log(url);
    const options = {
      "method": "get",
      "muteHttpExceptions" : true,
      "headers": {
        "authorization": "Bearer " + bearerToken
      },
    };
    const response = JSON.parse(UrlFetchApp.fetch(url, options));
    const data = response['data'] ?? []
    for(let d of data){
      Logger.log(d['id']);
      sendToDiscord(userId, d['id']);
    }
  }

}