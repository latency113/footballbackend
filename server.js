const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const cron = require("node-cron");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ เชื่อมต่อ MongoDB
mongoose
  .connect("mongodb+srv://loprommy55:1234@khan.hoqrd.mongodb.net/signup", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ สร้าง Schema และ Model
const signupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    activity: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

const Signup = mongoose.model("Signup", signupSchema);

// ✅ ตั้งเวลาให้ลบเอกสารทุกวันตอนเที่ยงคืน
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("🕛 กำลังลบเอกสารที่หมดอายุ...");
    const result = await Signup.deleteMany({ createdAt: { $lt: new Date() } });
    console.log(`🗑️ ลบไปแล้ว ${result.deletedCount} รายการ`);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการลบเอกสาร:", error);
  }
});

// ✅ ลงชื่อเข้าใช้
app.post("/signup", async (req, res) => {
  try {
    const { name, activity } = req.body;
    if (!name || !activity)
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });

    // ดึง IP address ของผู้ใช้
    const ipResponse = await axios.get("https://api.ipify.org?format=json");
    const createdBy = ipResponse.data.ip;

    const newSignup = new Signup({ name, activity, createdBy });
    await newSignup.save();
    res.json({ message: "✅ ลงชื่อสำเร็จ!" });
  } catch (error) {
    res.status(500).json({ error: "❌ Server Error" });
  }
});

// ✅ ดึงข้อมูลผู้เข้าร่วมทั้งหมด
app.get("/participants", async (req, res) => {
  try {
    const participants = await Signup.find().sort({ createdAt: -1 });
    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: "❌ Server Error" });
  }
});

// ✅ ลบข้อมูลที่ผู้เพิ่มเอง
app.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { createdBy } = req.body; // รับค่า createdBy จาก frontend

    // ค้นหาข้อมูล
    const signup = await Signup.findById(id);
    if (!signup) return res.status(404).json({ error: "ไม่พบข้อมูลที่ต้องการลบ" });

    // ตรวจสอบสิทธิ์การลบ
    if (signup.createdBy !== createdBy)
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบข้อมูลนี้" });

    // ลบข้อมูล
    await Signup.findByIdAndDelete(id);
    res.json({ message: "✅ ลบข้อมูลสำเร็จ!" });
  } catch (error) {
    res.status(500).json({ error: "❌ Server Error" });
  }
});

// ✅ ดึง IP address ของผู้ใช้
app.get("/getUserIP", async (req, res) => {
  try {
    const ipResponse = await axios.get("https://api.ipify.org?format=json");
    res.json({ createdBy: ipResponse.data.ip });
  } catch (error) {
    res.status(500).json({ error: "❌ ไม่สามารถดึง IP ได้" });
  }
});

// ✅ เริ่มเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
