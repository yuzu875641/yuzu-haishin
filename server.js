const express = require("express");
const router = express.Router();
const path = require("path");
const ytsr = require("ytsr");
const serverYt = require("./server/youtube.js");

const app = express();
const PORT = process.env.PORT || 3000;

// EJSテンプレートエンジンを使用するための設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静的ファイル（CSS, JSなど）を配信するための設定
app.use(express.static(path.join(__dirname, 'public')));

// 検索ページを表示するルート
router.get("/", (req, res) => {
    res.render("index", { videos: null, searchTerm: "" });
});

// 検索結果を処理するルート
router.get("/search", async (req, res) => {
    const searchTerm = req.query.q; // URLのクエリパラメータから検索語を取得

    if (!searchTerm) {
        // 検索語がない場合は、空のページをレンダリング
        return res.render("index", { videos: null, searchTerm: "" });
    }

    try {
        const filters = await ytsr.getFilters(searchTerm);
        const videoFilter = filters.get('Type').get('Video');
        const searchResults = await ytsr(videoFilter.url, { limit: 20 }); // 20件の動画を取得

        // 検索結果から必要な情報を抽出
        const videos = searchResults.items.filter(item => item.type === 'video').map(item => ({
            id: item.id,
            title: item.title,
            thumbnail: item.thumbnails[0].url,
            author: item.author.name,
            views: item.views,
            duration: item.duration
        }));

        res.render("index", { videos: videos, searchTerm: searchTerm });
    } catch (error) {
        console.error("検索エラー:", error);
        res.render("index", { videos: null, searchTerm: searchTerm, error: "検索中にエラーが発生しました。" });
    }
});

app.use("/", router);

app.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました。`);
});
