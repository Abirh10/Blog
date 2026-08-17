import conf from "../conf/conf.js";
import { Client, ID, Databases, Storage, Query } from "appwrite";

// The "articles" collection's real attribute names are lowercase
// (`featuredimage`, `userid`) rather than the camelCase the rest of this app
// uses (`featuredImage`, `userId`) — confirmed against a real Appwrite
// project: Appwrite rejects unrecognized keys with "Missing required
// attribute", so sending camelCase silently fails every create/update.
// Rather than spread that lowercase naming through every component that
// reads a post, the mismatch is translated right here at the boundary —
// components keep using the normal camelCase fields.
function toAppPost(doc) {
    if (!doc) return doc;
    const { featuredimage, userid, ...rest } = doc;
    return { ...rest, featuredImage: featuredimage, userId: userid };
}

function toAppwriteData({ title, content, featuredImage, status, userId }) {
    const data = { title, content, status };
    if (featuredImage !== undefined) data.featuredimage = featuredImage;
    if (userId !== undefined) data.userid = userId;
    return data;
}

export class Service {
    client = new Client();
    databases;
    bucket;

    constructor() {
        this.client
            .setEndpoint(conf.appwriteUrl)
            .setProject(conf.appwriteProjectId);
        this.databases = new Databases(this.client);
        this.bucket = new Storage(this.client);
    }

    async createPost({ title, slug, content, featuredImage, status, userId }) {
        try {
            const doc = await this.databases.createDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug,
                toAppwriteData({ title, content, featuredImage, status, userId })
            );
            return toAppPost(doc);
        } catch (error) {
            console.log("Appwrite service :: createPost :: error", error);
        }
    }

    async updatePost(slug, { title, content, featuredImage, status }) {
        try {
            const doc = await this.databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug,
                toAppwriteData({ title, content, featuredImage, status })
            );
            return toAppPost(doc);
        } catch (error) {
            console.log("Appwrite service :: updatePost :: error", error);
        }
    }

    async deletePost(slug) {
        try {
            await this.databases.deleteDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug
            );
            return true;
        } catch (error) {
            console.log("Appwrite service :: deletePost :: error", error);
            return false;
        }
    }

    async getPost(slug) {
        try {
            const doc = await this.databases.getDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug
            );
            return toAppPost(doc);
        } catch (error) {
            console.log("Appwrite service :: getPost :: error", error);
            return false;
        }
    }

    async getPosts(queries = [Query.equal("status", "active")]) {
        try {
            const response = await this.databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                queries
            );
            return { ...response, documents: response.documents.map(toAppPost) };
        } catch (error) {
            console.log("Appwrite service :: getPosts :: error", error);
            return false;
        }
    }

    async uploadFile(file) {
        try {
            return await this.bucket.createFile(
                conf.appwriteBucketId,
                ID.unique(),
                file
            );
        } catch (error) {
            console.log("Appwrite service :: uploadFile :: error", error);
            return false;
        }
    }

    async deleteFile(fileId) {
        try {
            await this.bucket.deleteFile(conf.appwriteBucketId, fileId);
            return true;
        } catch (error) {
            console.log("Appwrite service :: deleteFile :: error", error);
            return false;
        }
    }

    // Deliberately calls the SDK's getFileView, not getFilePreview, despite
    // the method name kept here (unchanged so every component that already
    // calls appwriteService.getFilePreview(...) keeps working). Confirmed
    // against the real project: Appwrite Cloud's free plan blocks image
    // *transformations* (resizing/cropping/etc, what /preview does) with a
    // storage_image_transformations_blocked error — /view serves the raw
    // uploaded file with no transformation and isn't gated by that limit,
    // which is all this app actually needs (it never resizes images).
    getFilePreview(fileId) {
        return this.bucket.getFileView(conf.appwriteBucketId, fileId);
    }
}

const service = new Service();
export default service;
