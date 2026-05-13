import { XMLParser } from "fast-xml-parser";

type RSSFeed = {
    channel: {
        title: string;
        link: string;
        description: string;
        item: RSSItem[];
    };
};

type RSSItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
};

export async function fetchFeed(feedURL: string) {
    const response = await fetch(feedURL, {
        headers: {
            "User-Agent": "gator"
        }
    });
    const text = await response.text();

    const parser = new XMLParser();
    const feed = parser.parse(text).rss as RSSFeed;

    if (!feed.channel) {
        throw new Error("Invalid RSS feed");
    }

    const { title, link, description } = feed.channel;
    if (!title || !link || !description) {
        throw new Error("Feed is missing required fields");
    }

    const items = Array.isArray(feed.channel.item) ? feed.channel.item : [feed.channel.item];

    for (const item of items) {
        const { title, link, description, pubDate } = item;
        if (!title || !link || !description || !pubDate) {
            throw new Error("Invalid RSS item");
        }
    }

    const result = {
        title,
        link,
        description,
        items
    }

    return result;
}

export function parseDuration(durationStr: string): number {
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);

    if (!match) {
        throw new Error("Invalid duration string");
    }

    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
        case "ms":
            return value;
        case "s":
            return value * 1000;
        case "m":
            return value * 60 * 1000;
        case "h":
            return value * 60 * 60 * 1000;
        default:
            throw new Error("Invalid duration string");
    }
}