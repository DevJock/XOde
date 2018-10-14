angular
    .module("XOde", ["ui.router", "ngResource"])
    .controller("XOdeSessionController", function ($scope) {
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

        $scope.connect = function (id) {
            let opponent = {};
            CLIENTS.forEach(client => {
                if (client.id == id) {
                    opponent = client;
                }
            });
            $scope.playing = true;
            PLAY(opponent);
        };

    });