const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect("mongodb+srv://loprommy55:1234@khan.hoqrd.mongodb.net/signup", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const signupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    activity: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 },
    createdBy: { type: String, required: true }, // เก็บ IP หรือข้อมูลผู้เพิ่ม
  },
  { timestamps: true }
);

const Signup = mongoose.model("Signup", signupSchema);

app.post("/signup", async (req, res) => {
  try {
    const { name, activity } = req.body;
    if (!name || !activity)
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });

    const createdBy = req.ip; // ดึง IP address ของผู้ที่ส่งคำขอ

    const newSignup = new Signup({ name, activity, createdBy });
    await newSignup.save();
    res.json({ message: "✅ ลงชื่อสำเร็จ!" });
  } catch (error) {
    res.status(500).json({ error: "❌ Server Error" });
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await Signup.find().sort({ createdAt: -1 });
    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: "❌ Server Error" });
  }
});

// ลบข้อมูลที่ผู้เพิ่มเอง
app.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { createdBy } = req.body; // ส่งค่า createdBy จาก frontend

    // ค้นหาข้อมูลที่ต้องการลบ
    const signup = await Signup.findById(id);

    if (!signup) {
      return res.status(404).json({ error: "ไม่พบข้อมูลที่ต้องการลบ" });
    }

    // ตรวจสอบว่า "ผู้ที่ขอลบ" เป็นผู้เพิ่มข้อมูลจริงๆ หรือไม่
    if (signup.createdBy !== createdBy) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบข้อมูลนี้" });
    }

    // ลบข้อมูลที่ตรงกับ ID
    await Signup.findByIdAndDelete(id);
    res.json({ message: "✅ ลบข้อมูลสำเร็จ!" });
  } catch (error) {
    res.status(500).json({ error: "❌ Server Error" });
  }
});

// เส้นทางใหม่เพื่อดึง IP address ของผู้ใช้
app.get("/getUserIP", (req, res) => {
  const ip = req.ip; // ดึง IP address ของผู้ใช้จาก request
  res.json({ createdBy: ip });
});

// ✅ เริ่มเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
