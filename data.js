module.exports = () => {
    const data = new Map();
    data.set('drivers', ['not ALVR', 'Also not ALVR']);
    data.set('audio', {
        list: [
            ['{0.0.0.00000000}.{a473034a-1e0d-4a28-bd3e-54878a50feff}', 'Device1'],
            ['{0.0.0.00000000}.{975d01fc-83d9-43f5-a24f-902bf13e177b}', 'The coolest device know to mankind']
        ],
        default_game_audio: '{0.0.0.00000000}.{975d01fc-83d9-43f5-a24f-902bf13e177b}'
    });
    return data;
};