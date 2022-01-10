""" App Module that queries Notes """

from os import environ
from datetime import datetime
import json
from pymongo import MongoClient
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from bson.json_util import dumps
from bson.objectid import ObjectId
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from prometheus_client import make_wsgi_app
from flask_caching import Cache

class RedisBaseConfig(object):
    CACHE_TYPE = "redis"
    CACHE_REDIS_HOST = environ["REDIS_HOST"]
    CACHE_REDIS_PORT = environ["REDIS_PORT"]
    CACHE_REDIS_DB = 0
    CACHE_REDIS_URL = f'redis://{environ["REDIS_HOST"]}:{environ["REDIS_PORT"]}/0'
    CACHE_DEFAULT_TIMEOUT = 500

app = Flask(__name__)

app.config.from_object(RedisBaseConfig)

cache = Cache(app)

app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {
    '/note/metrics': make_wsgi_app()
})

CORS(app, resources={r"/note/*": {"origins": "*"}})
app.config["CORS_HEADERS"] = "Content-Type"


def db_connect():
    """ Database connector Function """
    client = MongoClient(environ["DATABASE_URI"])
    _db = client[environ["DATABASE_NAME"]]
    collection = _db[environ["NOTE_COLLECTION"]]

    return collection


@app.route("/note/all/<int:uid>", methods = ['GET'])
def get_user_notes(uid):
    """
        Get all notes belonging to a user

        `uid` -> user id
    """

    client = db_connect()

    notes = json.loads(dumps(client.find({
        "user_id": uid
    })))

    response = jsonify(notes)

    response.headers.add("Access-Control-Allow-Origin", "*")
    response.status_code = 200
    return response


@app.route("/note/<int:uid>/<string:oid>", methods = ['GET'])
@cache.cached(timeout=30, query_string=True)
def get_note_info(uid, oid):
    """
        Get a single note info

        `uid` -> user id
        `oid` -> note id
    """

    client = db_connect()

    note = json.loads(dumps(client.find_one({
        "_id": ObjectId(oid),
        "user_id": uid
    })))

    if note is not None:
        response = jsonify(note)
        response.status_code = 200
    else:
        response = jsonify({})
        response.status_code = 404

    response.headers.add("Access-Control-Allow-Origin", "*")

    return response


@app.route("/note", methods = ['POST'])
@cross_origin()
def create_note():
    """
        Creates a single note for a user

        request_body:
            `user_id` -> note onwer(user) id
            `title` -> new note title
            `descriiption` -> new note description
    """

    date = datetime.utcnow()

    client = db_connect()

    request_body = request.get_json()

    note = {
        "user_id": request_body["user_id"],
        "title": request_body["title"],
        "description": request_body["description"],
        "createdAt": date,
        "updatedAt": date
    }

    result = client.insert_one(note)

    if result.inserted_id:
        response = jsonify({
            "message": "Note created successfully",
            "id": str(result.inserted_id)
        })
        response.status_code = 201
    else:
        response = jsonify({
            "status": "error",
            "message": "Error creating note"
        })
        response.status_code = 400

    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


@app.route("/note", methods = ['PUT'])
def update_note():
    """
        Update a single note for a user

        request_body:
            `id` -> note id
            `user_id` -> note onwer(user) id
            `title` -> new note title
            `descriiption` -> new note description
    """

    date = datetime.utcnow()

    client = db_connect()

    request_body = request.get_json()

    note_to_update = json.loads(dumps(client.find_one({
        "_id": ObjectId(request_body["id"]),
        "user_id": request_body["user_id"]
    })))

    if note_to_update is not None:
        note = {
            "title": request_body["title"],
            "description": request_body["description"],
            "updatedAt": date
        }

        result = client.update_one({
            "_id": ObjectId(request_body["id"])
        }, {
            "$set": note
        })

        if result.matched_count == 1:
            response = jsonify({
                "message": "Note updated successfully"
            })
            response.status_code = 200
        else:
            response = jsonify({
                "status": "error",
                "message": "Error updating note"
            })
            response.status_code = 400
    else:
        response = jsonify({
            "status": "error",
            "message": "Note does not exist"
        })
        response.status_code = 400


    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


@app.route("/note", methods = ['DELETE'])
def delete_note():
    """
        Delete a single note for a user

        request_body:
            `id` -> note id
            `user_id` -> note onwer(user) id
    """

    client = db_connect()

    request_body = request.get_json()

    note_to_delete = json.loads(dumps(client.find_one({
        "_id": ObjectId(request_body["id"]),
        "user_id": request_body["user_id"]
    })))

    if note_to_delete is not None:
        result = client.delete_one({
            "_id": ObjectId(request_body["id"])
        })

        if result.deleted_count == 1:
            response = jsonify({
                "message": "Note deleted successfully"
            })
            response.status_code = 200
        else:
            response = jsonify({
                "status": "error",
                "message": "Error deleting note"
            })
            response.status_code = 400
    else:
        response = jsonify({
            "status": "error",
            "message": "Note does not exist"
        })
        response.status_code = 400

    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


@app.route("/note", methods = ['HEAD'])
def health():
    """ Health check for service """

    response = jsonify()

    response.headers.add("Access-Control-Allow-Origin", "*")
    response.status_code = 200
    return response
