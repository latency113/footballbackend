const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());

// ✅ อนุญาตให้ React (Frontend) เชื่อมกับ API
app.use(cors());

// ✅ เชื่อมต่อ MongoDB Atlas
mongoose.connect(
  "mongodb+srv://loprommy55:1234@khan.hoqrd.mongodb.net/signup",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
).then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Schema (เพิ่ม Timestamp ให้ MongoDB จัดการอัตโนมัติ)
const signupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    activity: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // ลบข้อมูลหลัง 24 ชม.
  },
  { timestamps: true }
);

const Signup = mongoose.model("Signup", signupSchema);

// ✅ ลงชื่อ
app.post("/signup", async (req, res) => {
  try {
    const { name, activity } = req.body;
    if (!name || !activity) return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });

    const newSignup = new Signup({ name, activity });
    await newSignup.save();
    res.json({ message: "✅ ลงชื่อสำเร็จ!" });
  } catch (error) {
    res.status(500).json({ error: "❌ Server Error" });
  }
});

// ✅ ดึงรายชื่อวันนี้
app.get("/participants", async (req, res) => {
  try {
    const participants = await Signup.find().sort({ createdAt: -1 }); // เรียงจากใหม่ไปเก่า
    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: "❌ Server Error" });
  }
});

// ✅ เริ่มเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
