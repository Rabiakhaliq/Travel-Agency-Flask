from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import sys
import os

# Ensure backend path is included
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Import story logic
try:
    from story_trip import StoryTrip
    print("story_trip.py loaded successfully")
except Exception as e:
    print("CRITICAL ERROR: Could not load story_trip.py")
    print(f"Details: {e}")
    sys.exit(1)

app = Flask(__name__, static_folder='../frontend/static', template_folder='templates')
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_story', methods=['GET'])
def get_story():

    # ✅ FIX: request is now imported properly
    personality = int(request.args.get('personality', 1))
    mood = int(request.args.get('mood', 1))
    budget = int(request.args.get('budget', 1))
    preference = int(request.args.get('preference', 1))

    trip = StoryTrip(personality, mood, budget, preference)

    trip.generate_world()
    trip.generate_companion()
    trip.generate_environment()
    trip.generate_mission()
    trip.generate_danger()
    trip.generate_reward()
    trip.generate_ending()

    return jsonify({
        "status": "success",
        "story": trip.show_experience(),
        "image": trip.image_file,
        "destination": trip.destination
    })

@app.route('/save_story', methods=['POST'])
def save_story():
    data = request.get_json()
    destination = data.get('destination', 'Unknown Realm')
    story_text = data.get('story', '')
    image_file = data.get('image', 'default.jpeg')

    try:
        with open("story_history.txt", "a", encoding="utf-8") as file:
            file.write(f"---STORY_START---\n")
            file.write(f"DESTINATION: {destination}\n")
            file.write(f"IMAGE: {image_file}\n")
            file.write(f"STORY: {story_text}\n")
            file.write(f"---STORY_END---\n")
        return jsonify({"status": "success", "message": "Story preserved in chronicles."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/history', methods=['GET'])
def history():
    try:
        if not os.path.exists("story_history.txt") or os.path.getsize("story_history.txt") == 0:
            return jsonify({"status": "success", "history": []})

        with open("story_history.txt", "r", encoding="utf-8") as file:
            content = file.read()

        stories = []
        raw_blocks = content.split("---STORY_START---\n")
        for block in raw_blocks:
            if not block.strip():
                continue
            lines = block.split("\n")
            dest = "Unknown Location"
            img = "default.jpeg"
            story_content = ""
            
            for line in lines:
                if line.startswith("DESTINATION: "):
                    dest = line.replace("DESTINATION: ", "")
                elif line.startswith("IMAGE: "):
                    img = line.replace("IMAGE: ", "")
                elif line.startswith("STORY: "):
                    story_content = line.replace("STORY: ", "")
            
            stories.append({"destination": dest, "image": img, "story": story_content})

        return jsonify({"status": "success", "history": stories})
    except Exception as e:
        return jsonify({"status": "error", "history": [], "message": str(e)})

@app.route('/delete_history', methods=['POST'])
def delete_history():
    try:
        if os.path.exists("story_history.txt"):
            os.remove("story_history.txt")
        return jsonify({"status": "success", "message": "Chronicles cleared safely."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})
if __name__ == '__main__':
    print("Server starting on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)


