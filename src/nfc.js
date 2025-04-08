const { NFC } = require('nfc-pcsc');

class NFCManager {
    constructor() {
        this.nfc = new NFC();
        this.log = () => {};
        this.readers = new Map();
        this.lastCardInfo = null;

        this.setupListeners();
    }

    setupListeners() {
        this.nfc.on('reader', (reader) => {
            if (reader instanceof Error) {
                this.log(`Reader Error: ${reader.message}`);
                return;
            }

            // Debug log
            console.log('Reader connected:', reader.reader.name);

            this.readers.set(reader.reader.name, reader);
            this.log(`${reader.reader.name} device attached`);

            // Handle reader errors
            reader.on('error', (err) => {
                console.error(`Reader error: ${err}`);
            });

            // Uncomment if you want to handle status changes
            // reader.on('status', (status) => {
            //     console.log('Status changed:', status);
            // });
        });

        // Handle NFC errors
        this.nfc.on('error', (err) => {
            console.error('NFC Error:', err);
            this.log(`NFC Error: ${err.message}`);
        });
    }

    async writeCard(data, isUrl = false) {
        const reader = this.getFirstAvailableReader();
        if (!reader) {
            throw new Error('ไม่พบเครื่องอ่าน NFC');
        }

        // Wait for card placement
        this.log('รอการวางการ์ดบนเครื่องอ่าน...');

        try {
            // Convert data to Buffer
            const buffer = Buffer.from(data, 'utf8');

            if (isUrl) {
                // If it's a URL, use NDEF (not implemented here)
                this.log('ขณะนี้ไม่สามารถเขียน URL แบบ NDEF โดยตรง แต่เป็นข้อความธรรมดา');
            }

            // Write data to block 4
            await reader.write(4, buffer);
            this.log(`ข้อมูลลงบล็อค 4 สำเร็จ: ${data}`);

            return true;
        } catch (err) {
            this.log(`ข้อผิดพลาดในการเขียนการ์ด: ${err.message}`);
            throw err;
        }
    }

    async formatCard() {
        const reader = this.getFirstAvailableReader();
        if (!reader) {
            throw new Error('ไม่พบเครื่องอ่าน NFC');
        }

        this.log('รอการวางการ์ดบนเครื่องอ่านเพื่อฟอร์แมต...');

        try {
            // Create an empty buffer to clear data
            const emptyBuffer = Buffer.alloc(16, 0);

            // Clear sector 1 (blocks 4-6)
            for (let block = 4; block < 7; block++) {
                await reader.write(block, emptyBuffer);
                this.log(`ล้างข้อมูลบล็อค ${block} สำเร็จ`);
            }

            // Clear sector 2 (blocks 8-10)
            for (let block = 8; block < 11; block++) {
                await reader.write(block, emptyBuffer);
                this.log(`ล้างข้อมูลบล็อค ${block} สำเร็จ`);
            }

            this.log('ฟอร์แมตการ์ดสำเร็จ');
            return true;
        } catch (err) {
            this.log(`ข้อผิดพลาดในการฟอร์แมตการ์ด: ${err.message}`);
            throw err;
        }
    }

    getFirstAvailableReader() {
        if (this.readers.size === 0) {
            return null;
        }

        // Return the first reader from the Map
        return this.readers.values().next().value;
    }

    setLogCallback(callback) {
        this.log = callback;
    }

    getLastCardInfo() {
        return this.lastCardInfo;
    }

    hasReader() {
        return this.readers.size > 0;
    }
}

// Export a single instance of NFCManager
module.exports = new NFCManager();