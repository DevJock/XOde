/**
 * XOde Server Based TicTacToe Implementation
 * © 2018 Chiraag Bangera.
 * angularJS file that handles the MVC part of the Application
 */

 angular
    .module("XOde", ['ui.router'])
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('name', {
                name: 'name',
                controller: 'XOdeSessionController',
                templateUrl: "./templates/name.html"
            })
            .state('discover', {
                name: 'discover',
                templateUrl: "./templates/discover.html"
            })
            .state('game', {
                name: 'game',
                templateUrl: "./templates/game.html"
            })
            .state('gameover', {
                name: 'gameover',
                templateUrl: "./templates/gameover.html"
            });
    })
    .controller("XOdeSessionController", function ($scope, $state) {
        $state.go('name');

        $scope.nameError = function(){
            
        }

        $scope.nameUpdate = function () {
            NAME = $scope.name;
            CONNECT();
        }

        $scope.updateUI = function () {
            $scope.xscore = xScore;
            $scope.oscore = oScore;
            $scope.turn = turn == clientData.id ? "Your Turn" : "Opponent's";
            $scope.turn += " Turn to play";
        }

        $scope.showDiscovery = function(){
            $state.go('discover');
        }

        $scope.update = function () {
            $scope.clients = CLIENTS;
            $scope.players = PLAYERS;
            if (CLIENTS.length == 0) {
                $scope.message = "Looks like you are the first one Here =) | Invite someone by asking them to visit the page. ";
            }
            else {
                $scope.message = "Looking for Players";
            }
            if (PLAYERS.length > 0) {
                $scope.playersMessage = "Currently Active Players";
            }
            else {
                $scope.playersMessage = "";
            }
        }

        $scope.displayScore = function () {
            $state.go('gameover');
            $scope.xscore = xScore;
            $scope.oscore = oScore;
            if (xScore === 0 && oScore === 0) {
                $scope.gomessage = "";
                return;
            }
            $scope.gomessage = xScore > oScore ? "X" : "O";
            $scope.gomessage += " Wins the Game!!";
        }

        $scope.reboot = function () {
            REFRESH();
            $state.go('discover');
        }

        $scope.game = function () {
            $state.go('game');
        }

        $scope.connect = function (id) {
            let opponent;
            CLIENTS.forEach(client => {
                if (client.id === id) {
                    opponent = client;
                }
            });
            PLAY(opponent);
        };
    });
