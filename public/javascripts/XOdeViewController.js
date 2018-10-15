angular
    .module("XOde", ["ui.router", "ngResource"])
    .controller("XOdeSessionController", function ($scope) {
        $scope.gameOver = true;
        $scope.gameView = true;
        $scope.nameUpdate = function () {
            NAME = $scope.name;
            $scope.done = true;
            CONNECT();
        }

        $scope.displayClients = function(){
            $scope.clients = CLIENTS;
            if (CLIENTS.length == 0) {
                $scope.message = "Looks like you are the first one Here =)";
            }
            else {
                $scope.message = "Active Players";
            }
        };


        $scope.updateUI = function(){
            $scope.xscore = xScore;
            $scope.oscore = oScore;
            $scope.turn = turn == clientData.id ? "Your Turn" : "Opponent's";
            $scope.turn += " Turn to play";
        }

        $scope.displayScore = function(){
            $scope.xscore = xScore;
            $scope.oscore = oScore;
            $scope.gomessage = xScore > oScore ? "X" : "O";
            $scope.gomessage += " Wins the Game!!";
            $scope.gameOver = false;
            $scope.gameView = true;
        }

        $scope.connect = function (id) {
            let opponent = {};
            CLIENTS.forEach(client => {
                if (client.id == id) {
                    opponent = client;
                }
            });
            $scope.playing = true;
            PLAY(opponent);
            $scope.gameView = false;
        };

    });