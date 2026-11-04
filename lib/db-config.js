import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

// Database configuration
export const DB_NAME = process.env.MONGODB_NAME || "hotel_pos";

/**
 * Get database connection
 * @returns {Promise<Object>} MongoDB database connection
 */
export async function getDatabase() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

/**
 * Get database connection with client (for legacy API routes)
 * @returns {Promise<{client: Object, db: Object}>} MongoDB client and database
 */
export async function getDatabaseWithClient() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return { client, db };
}

/**
 * Get a collection from the database
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Object>} MongoDB collection
 */
export async function getCollection(collectionName) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

/**
 * Find a document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Document or null if not found
 */
export async function findById(collectionName, id) {
  const collection = await getCollection(collectionName);
  return collection.findOne({ _id: new ObjectId(id) });
}

/**
 * Find documents with optional query and sort
 * @param {string} collectionName - Name of the collection
 * @param {Object} query - MongoDB query object
 * @param {Object} sort - MongoDB sort object
 * @param {number} limit - Maximum number of documents to return
 * @returns {Promise<Array>} Array of documents
 */
export async function findDocuments(collectionName, query = {}, sort = {}, limit = 0) {
  const collection = await getCollection(collectionName);
  return collection.find(query).sort(sort).limit(limit).toArray();
}

/**
 * Insert a document
 * @param {string} collectionName - Name of the collection
 * @param {Object} document - Document to insert
 * @returns {Promise<Object>} Result of the insert operation
 */
export async function insertDocument(collectionName, document) {
  const collection = await getCollection(collectionName);
  return collection.insertOne({
    ...document,
    createdAt: new Date(),
  });
}

/**
 * Update a document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} id - Document ID
 * @param {Object} update - Document fields to update
 * @returns {Promise<Object>} Result of the update operation
 */
export async function updateDocument(collectionName, id, update) {
  const collection = await getCollection(collectionName);
  return collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...update,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Delete a document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Result of the delete operation
 */
export async function deleteDocument(collectionName, id) {
  const collection = await getCollection(collectionName);
  return collection.deleteOne({ _id: new ObjectId(id) });
}

/**
 * Count documents with optional query
 * @param {string} collectionName - Name of the collection
 * @param {Object} query - MongoDB query object
 * @returns {Promise<number>} Number of documents
 */
export async function countDocuments(collectionName, query = {}) {
  const collection = await getCollection(collectionName);
  return collection.countDocuments(query);
}