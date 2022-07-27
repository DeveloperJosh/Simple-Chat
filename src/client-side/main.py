import socketio

sio = socketio.Client()

@sio.on('connect')
def on_connect():
    print('connected')
    user = input('Enter your name: ')
    sio.emit('new-user', user)
    print('You can now start sending messages!')

@sio.on('message')
def message(data):
    print(data)
    sio.emit('message', data)

@sio.event
async def disconnect():
    print('disconnected from server')

def message_handler(data):
    sio.emit('message', data)

def main():
    sio.connect('https://AgreeableExhaustedGenres.developerjosh.repl.co')
    while True:
        message = input('')
        sio.emit('message', message)
# run the main function
if __name__ == '__main__':
    main()
    