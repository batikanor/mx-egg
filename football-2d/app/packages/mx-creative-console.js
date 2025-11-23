/**
 * mx-creative-console.js
 * A WebHID wrapper for the Logitech MX Creative Console (Keypad).
 *
 * Copyright (c) 2025 Mario Gutierrez
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

export class MXCreativeConsole extends EventTarget {
    constructor() {
        super();
        this.device = null;
        this.VENDOR_ID = 0x046d;
        this.PRODUCT_ID = 0xc354;
        this.LCD_SIZE = 118;

        // Internal state to track which keys are currently down
        this.activeKeys = new Set();

        // Initial magic reports required to wake/init the device
        this.INIT_REPORTS = [
            new Uint8Array([0x11, 0xff, 0x0b, 0x3b, 0x01, 0xa1, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
            new Uint8Array([0x11, 0xff, 0x0b, 0x3b, 0x01, 0xa2, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
        ];

        this.HID_MAP = {
            1: 0, 2: 1, 3: 2,
            4: 3, 5: 4, 6: 5,
            7: 6, 8: 7, 9: 8,
            0x01a1: 9, // Page Left
            0x01a2: 10 // Page Right
        };

        this._handleInput = this._handleInput.bind(this);
    }

    /**
     * Request WebHID connection
     */
    async connect() {
        try {
            const devices = await navigator.hid.requestDevice({
                filters: [{ vendorId: this.VENDOR_ID, productId: this.PRODUCT_ID }]
            });

            if (devices.length === 0) return false;
            this.device = devices[0];

            await this.device.open();

            // Send Init Sequence
            for (const report of this.INIT_REPORTS) {
                await this.device.sendReport(report[0], report.slice(1));
            }

            this.device.addEventListener('inputreport', this._handleInput);

            this.dispatchEvent(new CustomEvent('connected', { detail: { device: this.device } }));
            return true;

        } catch (err) {
            console.error("MX Console Connection Error:", err);
            throw err;
        }
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        if (this.device) {
            this.device.removeEventListener('inputreport', this._handleInput);
            this.device.close();
            this.device = null;
            this.activeKeys.clear();
            this.dispatchEvent(new CustomEvent('disconnected'));
        }
    }

    /**
     * Internal Input Handler
     * Parses HID reports and emits 'keydown' or 'keyup' events
     */
    _handleInput(event) {
        const { reportId, data } = event;
        const view = data;
        let currentFrameKeys = new Set();

        // 1. Parse Report to find currently pressed keys
        if (reportId === 0x13) { // Grid Buttons
            if (!this._validateHeader(view, [0xff, 0x02, 0x00, null, 0x01])) return;

            // Byte 5 onwards are button IDs
            for (let i = 5; i < view.byteLength; i++) {
                const val = view.getUint8(i);
                if (val === 0) break;
                if (this.HID_MAP[val] !== undefined) currentFrameKeys.add(this.HID_MAP[val]);
            }
        }
        else if (reportId === 0x11) { // Paging Buttons
            if (!this._validateHeader(view, [0xff, 0x0b, 0x00])) return;

            // Byte 3 onwards are 16-bit IDs
            for (let i = 3; i < view.byteLength; i += 2) {
                if (i + 1 >= view.byteLength) break;
                const val = view.getUint16(i, false); // Big Endian
                if (val === 0) break;
                if (this.HID_MAP[val] !== undefined) currentFrameKeys.add(this.HID_MAP[val]);
            }
        } else {
            return; // Unknown report
        }

        // 2. Diff against previous state to emit events

        // Detect Released Keys (in activeKeys but not in currentFrameKeys)
        // Note: Because Reports 0x13 and 0x11 are separate, we must be careful not to 
        // clear paging keys when receiving a grid report. 
        // However, the device usually sends a report containing ALL held keys for that specific type.
        // To simplify, we will process events based on the report type received.

        // Simple Diff logic:
        // We need to track keys per type or carefully merge. 
        // For this specific device, simply diffing the set derived from the report is safer 
        // assuming the report lists ALL keys of that type currently pressed.

        // Filter this.activeKeys to only those relevant to the current report type to perform accurate diff
        const isGrid = (reportId === 0x13);
        const relevantPreviousKeys = new Set([...this.activeKeys].filter(k => isGrid ? k <= 8 : k > 8));

        // Keys Released
        for (const key of relevantPreviousKeys) {
            if (!currentFrameKeys.has(key)) {
                this.activeKeys.delete(key);
                this.dispatchEvent(new CustomEvent('keyup', { detail: { key } }));
            }
        }

        // Keys Pressed
        for (const key of currentFrameKeys) {
            if (!this.activeKeys.has(key)) {
                this.activeKeys.add(key);
                this.dispatchEvent(new CustomEvent('keydown', { detail: { key } }));
            }
        }
    }

    /**
     * Set the image of a specific button.
     * @param {number} keyIndex - 0-8
     * @param {Blob|Uint8Array} imageBuffer - Must be JPEG data
     */
    async setKeyImage(keyIndex, imageBuffer) {
        if (!this.device) return;
        if (keyIndex > 8) return; // Paging buttons usually don't have LCDs accessible this way

        // Ensure we have a Uint8Array
        let uint8Data;
        if (imageBuffer instanceof Blob) {
            const buffer = await imageBuffer.arrayBuffer();
            uint8Data = new Uint8Array(buffer);
        } else {
            uint8Data = imageBuffer;
        }

        const packets = this._generateImagePackets(keyIndex, uint8Data);

        for (const packet of packets) {
            // Report ID 0x14 is first byte of generated packet, strip it for sendReport
            await this.device.sendReport(packet[0], packet.slice(1));
        }
    }

    /**
     * Set an entire sheet image at arbitrary coordinates on the device surface.
     * @param {Blob|Uint8Array} imageBuffer - JPEG data for the sheet
     * @param {number} x - x offset on the device sheet (pixels)
     * @param {number} y - y offset on the device sheet (pixels)
     * @param {number} width - width of the written area
     * @param {number} height - height of the written area
     */
    async setSheetImage(imageBuffer, x = 0, y = 0, width = this.LCD_SIZE, height = this.LCD_SIZE) {
        if (!this.device) return;

        let uint8Data;
        if (imageBuffer instanceof Blob) {
            const buffer = await imageBuffer.arrayBuffer();
            uint8Data = new Uint8Array(buffer);
        } else {
            uint8Data = imageBuffer;
        }

        const packets = this._generateImagePacketsForSheet(uint8Data, x, y, width, height);
        for (const packet of packets) {
            await this.device.sendReport(packet[0], packet.slice(1));
        }
    }

    // --- Private Helpers ---

    _validateHeader(view, bytes) {
        if (view.byteLength < bytes.length) return false;
        for (let i = 0; i < bytes.length; i++) {
            if (bytes[i] !== null && view.getUint8(i) !== bytes[i]) return false;
        }
        return true;
    }

    _generateImagePackets(keyIndex, jpegData) {
        const MAX_PACKET_SIZE = 4095;
        const PACKET1_HEADER = 20;
        const result = [];

        // Calculate coordinates
        const row = Math.floor(keyIndex / 3);
        const col = keyIndex % 3;
        const x = 23 + col * (118 + 40);
        const y = 6 + row * (118 + 40);

        // --- First Packet ---
        const packet1 = new Uint8Array(MAX_PACKET_SIZE);
        const byteCount1 = Math.min(jpegData.length, MAX_PACKET_SIZE - PACKET1_HEADER);

        packet1.set(jpegData.subarray(0, byteCount1), PACKET1_HEADER);

        const view1 = new DataView(packet1.buffer);
        view1.setUint8(0, 0x14); // Report ID
        view1.setUint8(1, 0xff);
        view1.setUint8(2, 0x02);
        view1.setUint8(3, 0x2b);
        view1.setUint8(4, this._generateWritePacketByte(1, true, byteCount1 >= jpegData.length));
        view1.setUint16(5, 0x0100);
        view1.setUint16(7, 0x0100);
        view1.setUint16(9, x);
        view1.setUint16(11, y);
        view1.setUint16(13, this.LCD_SIZE);
        view1.setUint16(15, this.LCD_SIZE);
        view1.setUint16(18, jpegData.length);

        result.push(packet1);

        // --- Subsequent Packets ---
        let remainingBytes = jpegData.length - byteCount1;
        let currentOffset = byteCount1;
        let part = 2;

        while (remainingBytes > 0) {
            const headerSize = 5;
            const byteCount = Math.min(remainingBytes, MAX_PACKET_SIZE - headerSize);
            const packet = new Uint8Array(MAX_PACKET_SIZE);

            packet.set(jpegData.subarray(currentOffset, currentOffset + byteCount), headerSize);

            const view = new DataView(packet.buffer);
            view.setUint8(0, 0x14);
            view.setUint8(1, 0xff);
            view.setUint8(2, 0x02);
            view.setUint8(3, 0x2b);
            view.setUint8(4, this._generateWritePacketByte(part, false, remainingBytes - byteCount === 0));

            result.push(packet);
            remainingBytes -= byteCount;
            currentOffset += byteCount;
            part++;
        }
        return result;
    }

    _generateImagePacketsForSheet(jpegData, x, y, writeWidth, writeHeight) {
        const MAX_PACKET_SIZE = 4095;
        const PACKET1_HEADER = 20;
        const result = [];

        // --- First Packet ---
        const packet1 = new Uint8Array(MAX_PACKET_SIZE);
        const byteCount1 = Math.min(jpegData.length, MAX_PACKET_SIZE - PACKET1_HEADER);

        packet1.set(jpegData.subarray(0, byteCount1), PACKET1_HEADER);

        const view1 = new DataView(packet1.buffer);
        view1.setUint8(0, 0x14); // Report ID
        view1.setUint8(1, 0xff);
        view1.setUint8(2, 0x02);
        view1.setUint8(3, 0x2b);
        view1.setUint8(4, this._generateWritePacketByte(1, true, byteCount1 >= jpegData.length));
        view1.setUint16(5, 0x0100);
        view1.setUint16(7, 0x0100);
        view1.setUint16(9, x);
        view1.setUint16(11, y);
        view1.setUint16(13, writeWidth);
        view1.setUint16(15, writeHeight);
        view1.setUint16(18, jpegData.length);

        result.push(packet1);

        // --- Subsequent Packets ---
        let remainingBytes = jpegData.length - byteCount1;
        let currentOffset = byteCount1;
        let part = 2;

        while (remainingBytes > 0) {
            const headerSize = 5;
            const byteCount = Math.min(remainingBytes, MAX_PACKET_SIZE - headerSize);
            const packet = new Uint8Array(MAX_PACKET_SIZE);

            packet.set(jpegData.subarray(currentOffset, currentOffset + byteCount), headerSize);

            const view = new DataView(packet.buffer);
            view.setUint8(0, 0x14);
            view.setUint8(1, 0xff);
            view.setUint8(2, 0x02);
            view.setUint8(3, 0x2b);
            view.setUint8(4, this._generateWritePacketByte(part, false, remainingBytes - byteCount === 0));

            result.push(packet);
            remainingBytes -= byteCount;
            currentOffset += byteCount;
            part++;
        }
        return result;
    }

    _generateWritePacketByte(index, isFirst, isLast) {
        let value = index | 0b00100000;
        if (isFirst) value |= 0b10000000;
        if (isLast) value |= 0b01000000;
        return value;
    }
}
