import { db } from "../config/database.js";

export async function getAllDiaries(req, res) {
  try {
    const { search } = req.query;
    let rows;

    if (search && search.trim() !== "") {
      const searchTerm = `%${search.trim()}%`;
      [rows] = await db.execute(
        `SELECT *
         FROM diaries
         WHERE title LIKE ? OR body LIKE ?
         ORDER BY created_at DESC`,
        [searchTerm, searchTerm]
      );
    } else {
      [rows] = await db.query(`
        SELECT *
        FROM diaries
        ORDER BY created_at DESC
      `);
    }

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Gagal mengambil data diary",
    });
  }
}

export async function getDiaryById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM diaries WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Diary tidak ditemukan",
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Gagal mengambil detail diary",
    });
  }
}

export async function createDiary(req, res) {
  try {
    const {
      title,
      diary_date,
      body,
      mood = "😊",
    } = req.body;

    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        message: "title wajib diisi dan minimal 3 karakter",
      });
    }

    if (!diary_date || !body) {
      return res.status(400).json({
        message: "title, diary_date, dan body wajib diisi",
      });
    }

    const preview = body.trim().slice(0, 100);

    const [result] = await db.execute(
      `INSERT INTO diaries
       (title, diary_date, preview, body, mood)
       VALUES (?, ?, ?, ?, ?)`,
      [
        title.trim(),
        diary_date,
        preview,
        body.trim(),
        mood,
      ]
    );

    const [rows] = await db.execute(
      "SELECT * FROM diaries WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Gagal menambahkan diary",
    });
  }
}

export async function updateDiary(req, res) {
  try {
    const { id } = req.params;

    const [oldRows] = await db.execute(
      "SELECT * FROM diaries WHERE id = ?",
      [id]
    );

    if (oldRows.length === 0) {
      return res.status(404).json({
        message: "Diary tidak ditemukan",
      });
    }

    const old = oldRows[0];

    if (req.body.title !== undefined && req.body.title.trim().length < 3) {
      return res.status(400).json({
        message: "title minimal 3 karakter",
      });
    }

    const {
      title = old.title,
      diary_date = old.diary_date,
      body = old.body,
      mood = old.mood,
      liked = old.liked,
    } = req.body;

    const preview = typeof body === "string" ? body.trim().slice(0, 100) : old.preview;

    const normalizedLiked =
      liked === true || liked === 1 || liked === "1"
        ? 1
        : liked === false || liked === 0 || liked === "0"
        ? 0
        : old.liked
        ? 1
        : 0;

    await db.execute(
      `UPDATE diaries
       SET title = ?,
           diary_date = ?,
           preview = ?,
           body = ?,
           mood = ?,
           liked = ?
       WHERE id = ?`,
      [
        typeof title === "string" ? title.trim() : title,
        diary_date,
        preview,
        typeof body === "string" ? body.trim() : body,
        mood,
        normalizedLiked,
        id,
      ]
    );

    const [rows] = await db.execute(
      "SELECT * FROM diaries WHERE id = ?",
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Gagal memperbarui diary",
    });
  }
}

export async function deleteDiary(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      "DELETE FROM diaries WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Diary tidak ditemukan",
      });
    }

    res.json({
      message: "Diary berhasil dihapus",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Gagal menghapus diary",
    });
  }
}
