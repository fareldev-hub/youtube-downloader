const express = require('express');
const ytdl = require('@distube/ytdl-core'); // ✅ ganti ke fork
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Routing halaman utama
app.get('/', (req, res) => {
    res.render('index');
});

// Routing download (POST)
app.post('/download', async (req, res) => {
    const url = req.body.url;
    const type = req.body.type; // ytmp3 / ytmp4
    
    if (!ytdl.validateURL(url)) return res.send("URL tidak valid");
    try {
        const info = await ytdl.getInfo(url);
        const rawTitle = info.videoDetails.title || 'video';
        const title = rawTitle.replace(/[^\w\s\-().]/g, '').slice(0, 180); // aman untuk nama file

        if (type === 'ytmp3') {
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
            ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
              .on('error', err => {
                  console.error('ytdl error:', err);
                  if (!res.headersSent) res.status(500).send('Gagal unduh audio');
              })
              .pipe(res);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
            ytdl(url, { quality: 'highestvideo' })
              .on('error', err => {
                  console.error('ytdl error:', err);
                  if (!res.headersSent) res.status(500).send('Gagal unduh video');
              })
              .pipe(res);
        }
    } catch (err) {
        console.error(err);
        res.send('Terjadi kesalahan: ' + err.message);
    }
});

// API endpoint untuk developer
app.get('/api/download', async (req, res) => {
    const { url, type } = req.query;
    if (!url || !type) return res.status(400).json({ error: "URL dan type wajib" });

    if (!ytdl.validateURL(url)) return res.status(400).json({ error: "URL tidak valid" });

    try {
        const info = await ytdl.getInfo(url);
        const rawTitle = info.videoDetails.title || 'video';
        const title = rawTitle.replace(/[^\w\s\-().]/g, '').slice(0, 180);

        const downloadUrl = `/download?url=${encodeURIComponent(url)}&type=${type}`;
        res.json({
            title,
            type,
            downloadUrl
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});