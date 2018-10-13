let clients = [];
angular
    .module("XOde", ["ui.router", "ngResource"])
    .controller("XOdeSessionController", function ($scope, $http) {
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
        $scope.connect = function (id) {
            let player2 = {};
            clients.forEach(client => {
                if (client.id == id) {
                    player2 = {
                        id: client.id,
                        ip: client.ip,
                        name: client.name
                    }
                }
            });
            CONNECT(clientData, player2);
        };
    });