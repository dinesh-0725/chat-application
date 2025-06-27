from flask import Flask, render_template, request, session, redirect, url_for
# from flask_migrate import Migrate
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
import random

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:1234@localhost/chat1"
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, resources={r"/*": {"origins": "https://localhost:3000"}})
Session(app)
db = SQLAlchemy(app)
# migrate = Migrate(app, db)
socketio = SocketIO(app, cors_allowed_origins="https://localhost:3000")


# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Text, unique=True, nullable=False)
    password = db.Column(db.Text, nullable=False)


# Global dictionary to store active users
active_users = {}

# Create database tables
with app.app_context():
    db.create_all()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    password = request.form['password']
    if User.query.filter_by(username=username).first():
        return "User already exists", 400
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return "User registered", 200


@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        session['username'] = user.username
        return "Logged in", 200
    return "Invalid credentials", 400


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))


@socketio.on('connect_user')
def handle_connect_user(data):
    username = data['username']
    print(username)
    if username and username not in active_users:
        active_users[username] = {'sid': request.sid, 'status': 'disconnected', 'partner': None}
    elif username in active_users:
        active_users[username]['sid'] = request.sid


@socketio.on('start_chat')
def handle_start_chat(data):
    username = data['username']
    print(username, active_users[username]['status'])
    if active_users[username]['status'] == 'connected':
        emit('chat_start', {'partner': None, 'message': 'Already connected to a partner.'}, room=request.sid)
        return

    available_users = [user for user in active_users.keys() if
                       user != username and active_users[user]['status'] == 'disconnected']
    print(available_users)
    if available_users:
        matched_partner = random.choice(available_users)
        active_users[matched_partner]['status'] = 'connected'
        active_users[username]['status'] = 'connected'
        active_users[username]['partner'] = matched_partner
        active_users[matched_partner]['partner'] = username
        emit('chat_start', {'partner': matched_partner}, room=request.sid)
        socketio.emit('chat_start', {'partner': username}, room=active_users[matched_partner]['sid'])
        print(active_users)
    else:
        emit('chat_start', {'partner': None}, room=request.sid)


@socketio.on('chat_message')
def handle_chat_message(data):
    sender_username = data.get('username')
    msg = data.get('msg', '')
    type_text = data.get('type', 'text')
    recipient_username = data.get('recipient')
    recipient_sid = active_users.get(recipient_username, {}).get('sid')
    print(recipient_sid, active_users)
    if recipient_sid and active_users[recipient_username]['status'] == 'connected':
        socketio.emit('chat_message', {'username': sender_username, 'type': type_text, 'msg': msg}, room=recipient_sid)


@socketio.on('callUser')
def handle_call_user(data):
    user_to_call = data['userToCall']
    signal_data = data['signalData']
    from_user = data['from']
    name = data['name']

    fromUserSid = active_users[from_user]['sid']

    # Check if the user is available
    if user_to_call in active_users:
        emit('callUser', {'from': from_user, 'name': name, 'signal': signal_data},
             room=active_users[user_to_call]['sid'])
    else:
        # Handle missed call here, for now just send a missed call event
        emit('missedCall', {'from': from_user, 'to': user_to_call, 'name': name}, room=active_users[from_user]['sid'])


@socketio.on('answerCall')
def handle_answer_call(data):
    to_user = data['to']
    signal = data['signal']
    print(to_user, to_user in active_users)

    # Emit back the answer with signal
    if to_user in active_users:
        emit('callAccepted', signal, room=active_users[to_user]['sid'])


@socketio.on('missedCall')
def handle_missed_call(data):
    from_user = data['from']
    to_user = data['to']
    name = data['name']

    # Notify the user that the call was missed
    emit('missedCall', {'from': from_user, 'to': to_user, 'name': name}, room=active_users[from_user]['sid'])


@socketio.on('disconnect')
def handle_disconnect():
    username = None
    for user, info in list(active_users.items()):
        if info['sid'] == request.sid:
            username = user
            break
    if username:
        partner = active_users[username]['partner']
        active_users.pop(username, None)
        if partner and active_users[partner]['status'] == 'connected':
            active_users[partner]['status'] = 'disconnected'
            active_users[partner]['partner'] = None
            socketio.emit('partner_disconnected', {'message': f"{username} disconnected."},
                          room=active_users[partner]['sid'])


if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
