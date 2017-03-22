
class CloneNotValid extends Error {

    constructor(messages) {
        super(messages);
        this.name = 'CloneNotValid';
        this.messages = messages;
    }

    getMessages(){
        var messages = '- ';
        this.messages.forEach(function(message){
            messages += Object.keys(message)[0] + ': ' + message[Object.keys(message)[0]] + ' - ';
        });
        return messages;
    }
}
module.exports = CloneNotValid;
