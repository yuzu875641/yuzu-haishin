const express = require("express");
const router = express.Router();
const path = require("path");
const ytsr = require("ytsr");
const wakamess = require("./server/wakame.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// エラーハンドリング用のミドルウェア
app.use((err, req, res, next) => {
    console.error('サーバーエラー:', err.stack);
    res.status(500).render('error', {
        title: 'サーバーエラー',
        message: '予期せぬエラーが発生しました。時間をおいて再度お試しください。'
    });
});

router.get("/", (req, res) => {
    res.render("index", { videos: null, searchTerm: "" });
});

router.get("/search", async (req, res, next) => {
    const searchTerm = req.query.q;

    if (!searchTerm) {
        return res.render("index", { videos: null, searchTerm: "" });
    }

    try {
        const filters = await ytsr.getFilters(searchTerm);
        const videoFilter = filters.get('Type').get('Video');
        const searchResults = await ytsr(videoFilter.url, { limit: 20 });

        const videos = searchResults.items.filter(item => item.type === 'video').map(item => ({
            id: item.id,
            title: item.title,
            thumbnail: item.thumbnails[0]?.url || 'https://via.placeholder.com/160x90.png?text=No+Thumbnail',
            author: item.author?.name || '不明',
            views: item.views,
            duration: item.duration,
            isLive: item.isLive
        }));

        res.render("index", { videos: videos, searchTerm: searchTerm });
    } catch (error) {
        console.error("検索エラー:", error.stack);
        // エラーを次のミドルウェアに渡す
        next(error);
    }
});

router.get("/video/:id", async (req, res, next) => {
    const videoId = req.params.id;
    try {
        const videoInfo = await wakamess.getYouTube(videoId);
        if (videoInfo instanceof Error) {
            throw videoInfo;
        }
        res.render("video", { videoInfo: videoInfo });
    } catch (error) {
        console.error("動画情報取得エラー:", error.stack);
        // エラーを次のミドルウェアに渡す
        next(error);
    }
});

app.use("/", router);

app.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました。`);
});
