var app = new Vue({
    el: '#formApp',
    data: {
        'title': '',
        'reason': '',
        'repaymentplan': '',
        'amountrequested': null, // string number in eth. parsed to wei and then passed directly to our contract as itll take care of it
        'phonenumber': '',
    },
    computed: {
        formIsValid: function () {
            let validAmt = this.amountrequested;
            return this.title && this.reason && this.repaymentplan && validAmt && this.phonenumber;
        }
    }
});


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


    initUI: async () => {

        return App.bindEvents();
    },


    bindEvents: () => {

        $('#submit').click(e => {
            App.loanSubmit();
        })
    },

    // 1000000000000000000 WEI
    loanSubmit: async () => {

        console.log("loan request pending");
        toggleFormSubmit(true);

        const acct = (await web3.eth.getAccounts())[0];
        console.log(acct);

        const loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();

        console.log("%s %s %s %s %s", app.title, app.reason, app.repaymentplan, app.amountrequested, app.phonenumber);

        let amountReqWei = web3.utils.toWei(app.amountrequested, 'ether');

        try {
            // get an estimate of the gas to use
            const gas = await loanRequestPlatformInstance.requestLoan.estimateGas(app.title, app.reason, app.repaymentplan, amountReqWei, app.phonenumber, {from: acct});
            // perform transaction using the gas estimate
            const tx = await loanRequestPlatformInstance.requestLoan(app.title, app.reason, app.repaymentplan, amountReqWei, app.phonenumber, {
                from: acct,
                gas: gas
            });

            console.log(tx);
            console.log("loan request success");

            window.location.href = "personaldashboard.html"

        } catch (err) {
            console.log(err);
            // there was an error. put screen back to unloading-state
            toggleFormSubmit(false);
        }


    },


};

$(window).on("load", function () {

    App.init();

});

