App = {

    web3Provider: null,
    contracts: {},

    init: () => {
        console.log("App.init()");
        return App.initWeb3();
    },

    initWeb3: () => {
        if (typeof web3 !== 'undefined') { // check if injected web3 provider such as metamask
            App.web3Provider = web3.currentProvider;
            console.log("found existing web3 provider");
        } else {
            App.web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
            console.log("connecting to local Ganache");
        }
        web3 = new Web3(App.web3Provider);
        console.log("initialized web3 instance");
        return App.initContract();
    },

    initContract: () => {

        $.getJSON("LoanRequestPlatform.json", (data) => {
            // This creates an instance of the contract we can interact with.
            App.contracts.loanRequestPlatform = TruffleContract(data);
            // Set the provider for our contract
            App.contracts.loanRequestPlatform.setProvider(App.web3Provider);
            console.log("initialized loan request platform contract");

            return App.initUI();
        });
    },


    initUI: () => {
        console.log("App.initUI()");

        let lr_platform;
        App.contracts.loanRequestPlatform.deployed().then(instance => {
            lr_platform = instance;

            web3.eth.accounts[0]

            return electionInstance.name.call();
        }).then(name => {
            $("#election-name").text(name);
            return electionInstance.candidates.call(0);
        }).then(candidate1 => {
            $("#results #candidate-name").children()[0].text(candidate1[0]);
            $("#results #vote-count").children()[0].text(candidate1[1]);
            return electionInstance.candidates.call(1);
        }).then(candidate2 => {
            $("#results #candidate-name").children()[1].text(candidate2[0]);
            $("#results #vote-count").children()[1].text(candidate2[1]);
        }).catch(e => {
            console.log(e.msg);
        });

        return App.bindEvents();
    },

    bindEvents: () => {
        $(".vote").on('click', () => {
            let voteIndex = $(this).attr('data-index');
            App.submitVote(voteIndex);
        })
    },

    submitVote: voteIndex => {
        console.log("App.submitVote()");

        App.contracts.Election.deployed().then(instance => {
            return instance.vote(voteIndex, {
                from: web3.eth.accounts[0]
            });
        }).then(result => {
            console.log("tx hash: " + result.txt);
            for (let i = 0; i < result.logs.length; i++) {
                let log = result.logs[i];
                if (log.event == "Vote") {
                    App.updatedVoteCount();
                }
            }
        }).catch(e => {
            console.log(e.msg);
        });
    },

    updateVoteCount: () => {
        console.log("App.updateVoteCount()");
        let electionInstance;

        App.contracts.Election.deployed().then(instance => {
            electionInstance = instance;
            return electionInstance.candidates.call(0);
        }).then(candidate1 => {
            $("#results #vote-count").children()[0].text(candidate1[1]);
            return electionInstance.candidates.call(1);
        }).then(candidate2 => {
            $("#results #vote-count").children()[1].text(candidate2[1]);
        }).catch(e => {
            console.log(e.msg);
        });
    }

};

$(window).on("load", function () {

    App.init();

});

