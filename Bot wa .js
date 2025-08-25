const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const qrcode = require("qrcode-terminal")

// Atur jam OFF & ON (format jam:menit)
const offUntil = "01:50" // jam berapa bot ON lagi
let isOff = true // awalnya OFF

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on("creds.update", saveCreds)

    // Cek status setiap menit
    setInterval(() => {
        const now = new Date()
        const jam = now.getHours().toString().padStart(2, "0")
        const menit = now.getMinutes().toString().padStart(2, "0")
        const waktu = `${jam}:${menit}`

        if (waktu === offUntil) {
            isOff = false
            console.log("Bot sudah ON kembali")
        }
    }, 60000)

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type === "notify") {
            const msg = messages[0]
            if (!msg.message) return

            const from = msg.key.remoteJid
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text
            const sender = msg.pushName || "Orang"

            console.log("Pesan masuk dari", sender, ":", text)

            // Kalau masih OFF
            if (isOff) {
                await sock.sendMessage(from, { text: `Maaf, ${sender} lagi OFF 😴. Akan ON lagi jam ${offUntil}.` })
                return
            }

            // Kalau sudah ON → Balas normal
            let balasan = "Halo 👋, saya bot WhatsApp!"
            if (sender.toLowerCase().includes("ppp")) {
                balasan = "Hai Ppp! Saya lagi sibuk, tapi sekarang sudah ON ✅"
            } else if (sender.toLowerCase().includes("andika")) {
                balasan = "Halo Andika! Aku sudah ON kembali jam " + offUntil
            } else if (text.toLowerCase().includes("hai") || text.toLowerCase().includes("halo")) {
                balasan = "Hai juga! Ada yang bisa saya bantu?"
            }

            await sock.sendMessage(from, { text: balasan })
        }
    })
}

startBot()
