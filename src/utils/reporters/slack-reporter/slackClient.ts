import fs from 'fs';
import path from 'path';
import { config } from '@config';
import { Logger } from '@utils/logger.ts';
import { FilesUploadV2Arguments, WebClient } from '@slack/web-api';

/**
 * Client for interacting with Slack API
 * Sends a message to the client either with plain text or by blocks
 * Supports uploading a file using uploadFile
 *
 */
export class SlackClient {
    // slack integration configuration
    private readonly TOKEN: string = config.SLACK_TOKEN;
    private readonly CHANNEL: string = `#${config.SLACK_CHANNEL}`;
    private readonly CHANNEL_ID: string = config.SLACK_CHANNEL_ID;

    // initialize the web client
    private client = new WebClient(this.TOKEN);

    /**
     * Sends a plain text message to the Slack channel
     * @param text
     * @returns
     */
    async sendMessage(text: string) {
        return this.client.chat.postMessage({
            channel: this.CHANNEL,
            text,
        });
    }

    /**
     * Send a block message to the Slack channel
     * @param blocks
     * @returns
     */
    async sendBlock(blocks: any[]) {
        return this.client.chat.postMessage({
            channel: this.CHANNEL,
            blocks,
        });
    }

    /**
     * Upload a file to the slack channel
     * @param filePath
     * @param title
     * @returns
     */
    async uploadFile(filePath: string, title?: string) {
        if (!fs.existsSync(filePath)) {
            Logger.warn(`File does not exist: ${filePath}`);
            return;
        }

        const args: FilesUploadV2Arguments = {
            channel_id: this.CHANNEL_ID,
            file: fs.createReadStream(filePath),
            title: title ?? path.basename(filePath),
        };

        return this.client.files.uploadV2(args);
    }
}
