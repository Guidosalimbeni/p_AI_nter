from flask import Flask, request, jsonify
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 
app.config['JSON_AS_ASCII'] = False
app.config['JSON_SORT_KEYS'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.config['JSONIFY_MIMETYPE'] = 'application/json'
app.config['JSONIFY_COMPACT'] = False

@app.route('/process-image', methods=['POST'])
def process_image():
    print ('received request')
    data = request.get_json()
    image_data = data['imageData']
    object_positions = data['objectPositions']
    
    # Process the image data and object positions using OpenCV
    # ...
    print ('received request')
    print (image_data)
    result = {'processedData': 'temp' }
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000)