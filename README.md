# นิทรรศการออนไลน์เสมือนจริง 100% Interactive: สมเด็จพระนางเจ้ารำไพพรรณี พระบรมราชินีในรัชกาลที่ 7
### สถาบันพระปกเกล้า (King Prajadhipok's Institute)

ระบบนิทรรศการเสมือนจริง 3 มิติ (3D WebGL Virtual Exhibition) สไตล์ **Apple.com Aesthetic** สำหรับถ่ายทอดพระราชประวัติ พระราชกรณียกิจ และมรดกทางประวัติศาสตร์ ขับเคลื่อนด้วยสถาปัตยกรรม **Modern Angular 21+** และ **Open-Source 100%** ไร้ค่าใช้จ่าย License ปลั๊กอินพาณิชย์ พร้อมระบบบันทึกสถิติและประเมินผลการใช้งาน

---

## 🏛️ จุดเด่นและฟังก์ชันสำคัญของระบบ

1. **100% Interactive 3D Virtual Hall & 360° Inspector**:
   - ห้องนิทรรศการเสมือนจริง 3 มิติด้วย **Three.js WebGL Engine**
   - สำรวจชิ้นงานสำคัญ 6 ชิ้นแบบ 360 องศา, โหมด X-Ray Wireframe, จุดสังเกตจำเพาะ (Hotspots) และระบบเสียงบรรยายภาษาไทย
2. **Interactive Historical Timeline (5 ยุคประวัติศาสตร์)**:
   - ระบบ Scrollytelling มีชีวิต พร้อมเสียงบรรยายประวัติศาสตร์
   - วิดเจ็ตเปรียบเทียบภาพจดหมายเหตุโบราณกับภาพสีฟื้นฟูดิจิทัล (Before / After Slider)
3. **Chanthaboon Mat Weaving Studio (สตูดิโอทอเสื่อจันทบูรจำลอง)**:
   - เลือกลายพระราชสำนัก ลายดอกแก้ว หรือออกแบบลายเสื่อด้วยตนเองด้วยสีย้อมธรรมชาติ
   - จำลองการทอกี่แบบแอนิเมชัน 3 มิติ
4. **Historical Quiz & Digital Certificate Generator**:
   - แบบทดสอบ 5 ข้อประวัติศาสตร์ พร้อมแสดงผลคะแนนและเอฟเฟกต์ Confetti
   - ออกเกียรติบัตรดิจิทัลระบุชื่อผู้เข้าชมและตราสถาบันพระปกเกล้า สามารถสั่งพิมพ์หรือเซฟเป็น PDF ได้ทันที
5. **Visitor Satisfaction Survey (แบบประเมิน 4 มิติ)**:
   - ประเมินคะแนน 5 ดาว 4 ด้าน (เนื้อหา, ปฏิสัมพันธ์, ความสวยงาม, ความสะดวก)
   - คำนวณ Net Promoter Score (NPS) และแสดงข้อเสนอแนะแบบ Real-time
6. **KPI Executive Analytics Dashboard (ระบบสถิติผู้บริหาร)**:
   - บันทึกสถิติผู้เข้าชมแบบ **รายวัน (30 วัน), รายเดือน (12 เดือน), รายปี (5 ปี)** ด้วย Chart.js
   - วิเคราะห์ความสนใจรายหัวข้อ (Topic & Exhibit Heatmap) และระยะเวลาการเข้าชมเฉลี่ย (Dwell Time)
   - ส่งออกข้อมูลเป็น **CSV** และ **JSON** ได้ด้วยคลิกเดียว

---

## 🚀 สถาปัตยกรรม Open-Source และความพร้อมติดตั้งบน Cloud สถาบันพระปกเกล้า

ระบบถูกออกแบบมาให้เป็น **Open Source 100%** ไม่มี dependency ที่ต้องจ่ายค่าลิขสิทธิ์รายเดือน/รายปี สามารถนำไปติดตั้งบน Kubernetes, Docker Swarm หรือ Cloud VM ของสถาบันพระปกเกล้าได้ทันที

### การรันระบบด้วย Docker (Production Mode)

```bash
# 1. Build และ Start Container
docker compose up -d --build

# 2. ตรวจสอบสถานะการทำงาน
docker ps

# 3. เข้าใช้งานผ่านเบราว์เซอร์
http://localhost:8080
```

### การรันและพัฒนาในเครื่อง (Development Mode)

```bash
# ติดตั้ง dependencies
npm install

# รัน Development Server
npm start
# เข้าใช้งานที่: http://localhost:4200

# ทดสอบ Production Build
npm run build
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
interactive-web/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/exhibition.models.ts     # Data Models
│   │   │   └── services/
│   │   │       ├── analytics.service.ts         # สถิติ รายวัน/เดือน/ปี/Heatmap
│   │   │       ├── exhibition-data.service.ts   # ข้อมูลประวัติศาสตร์ & วัตถุ 3D
│   │   │       ├── audio.service.ts             # Procedural Synth & TTS Thai
│   │   │       └── survey.service.ts            # ระบบแบบประเมิน & NPS
│   │   ├── shared/
│   │   │   └── components/
│   │   │       ├── navbar/                      # Apple-style Floating Nav
│   │   │       ├── footer/                      # KPI Institutional Footer
│   │   │       ├── audio-player-bar/            # Waveform Mini Player
│   │   │       └── artifact-modal/              # Three.js 3D Inspector
│   │   ├── features/
│   │   │   ├── home/                            # Landing & Highlights
│   │   │   ├── virtual-hall/                    # 3D WebGL Museum Hall
│   │   │   ├── timeline/                        # Scrollytelling 5 Eras
│   │   │   ├── workshops/                       # Weaving Studio & Quiz Cert
│   │   │   ├── survey/                          # Evaluation Form
│   │   │   └── admin-dashboard/                 # KPI Executive Analytics
│   │   ├── app.routes.ts
│   │   ├── app.config.ts
│   │   └── styles.css                           # Royal Heritage Design Tokens
├── Dockerfile                                   # Production Container Build
├── nginx.conf                                   # Nginx with Gzip & Security
├── docker-compose.yml
└── package.json
```

---

**พัฒนาสำหรับ**: สถาบันพระปกเกล้า (King Prajadhipok's Institute)  
**มาตรฐานดีไซน์**: Apple.com Aesthetic & Modern WebGL Architecture
