let clients = [];
angular
    .module("XOde", ["ui.router", "ngResource"])
    .controller("XOdeSessionController", function ($scope, $http) {
        $scope.playing = false;
        $scope.nameUpdate = function () {
            NAME = $scope.name;
            $scope.done = true;
            CONNECT();
            $http.post("/clients", {
                id: clientData.ip
            }).then(function callBack(response) {
                if (response.data) {
                    $scope.clients = response.data;
                    clients = response.data;
                    if ($scope.clients.length == 0) {
                        $scope.message = "Looks like you are the first one Here =)";
                    }
                    else {
                        $scope.message = "Active Players";
                    }
                }
            });
        }

        $scope.connect = function (id) {
            let opponent = {};
            $scope.clients.forEach(client => {
                if(client.id == id)
                {
                    opponent = client;
                }
            });
            $scope.playing = true;
            PLAY(opponent);
        };

    });