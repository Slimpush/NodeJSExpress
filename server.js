import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const __dirname = path.resolve();
const PORT = process.env.PORT ?? 3000;
const app = express();

let db;


async function initDb() {
    db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            value INTEGER
        )
    `);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));


app.get('/items', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM items');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/items/:id', async (req, res) => {
    try {
        const row = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Запись не найдена' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/items', async (req, res) => {
    try {
        const { name, value } = req.body;
        const result = await db.run('INSERT INTO items (name, value) VALUES (?, ?)', [name, value]);
        res.json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.put('/items/:id', async (req, res) => {
    try {
        const { name, value } = req.body;
        const result = await db.run('UPDATE items SET name = ?, value = ? WHERE id = ?', [name, value, req.params.id]);
        if (result.changes) {
            res.json({ message: 'Запись обновлена' });
        } else {
            res.status(404).json({ error: 'Запись не найдена' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.delete('/items/:id', async (req, res) => {
    try {
        const result = await db.run('DELETE FROM items WHERE id = ?', [req.params.id]);
        if (result.changes) {
            res.json({ message: 'Запись удалена' });
        } else {
            res.status(404).json({ error: 'Запись не найдена' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Порт сервера ${PORT}`);
    });
}).catch(err => {
    console.error('Не удалось инициализировать базу данных:', err);
});
