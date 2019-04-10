var app = new Vue({
    el: '#allLoans',
    data: {
        allLoans: [],
        displayedLoan: {
            'willPay': 0, // so that vue can be bound to this (in ETH)
        },
    },
    methods: {
        updateModal: function (loan) {
            this.displayedLoan = loan;
        },
    },
    computed: {
        validPayAmt: function () {
            // positive value less than remaining amount needed
            return (0 < parseFloat(this.displayedLoan.willPay)) &&
                (parseFloat(this.displayedLoan.willPay) <= parseFloat(this.displayedLoan.amountReq) - parseFloat(this.displayedLoan.amountAcc));
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

            return App.initLoanRequestsData();
        });
    },

    initLoanRequestsData: async () => {

        const loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();

        const numLoans = await loanRequestPlatformInstance.numContracts();
        console.log("There are " + numLoans + " total loans");

        // create a list of objects of the actual loan request data
        let lrads = [];
        for (let i = 0; i < numLoans; i++) {
            // get ith contract's address and data
            const lra = await loanRequestPlatformInstance.contracts(i);
            const lrd = await loanRequestPlatformInstance.extractLoanRequestContractData(lra);
            lrads.push([lra, lrd]);
        }
        // parse into nice format
        const acct = (await web3.eth.getAccounts())[0];
        app.allLoans = formatLoanRequestData(lrads, acct);

        return App.initUI();
    },


    initUI: async () => {

        const acct = (await web3.eth.getAccounts())[0];

        return App.bindEvents();
    },


    bindEvents: () => {

        $('#submit').click(e => {
            App.loanPay();
        })

    },


    loanPay: async () => {
        // at this point, we already have a displayed loan with all the needed information to make a payment

        console.log("loan payment pending");
        toggleFormSubmit(true);

        const acct = (await web3.eth.getAccounts())[0];
        console.log(acct);

        const loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();

        let displayedLoanAddr = app.displayedLoan.lra;
        let payAmt = app.displayedLoan.willPay;
        console.log("Paying %s ETH to %s", payAmt, displayedLoanAddr);

        try {

            // get an estimate of the gas to use
            const gas = await loanRequestPlatformInstance.sendPayment.estimateGas(displayedLoanAddr, {
                from: acct,
                value: web3.utils.toWei(payAmt)
            });
            // perform transaction using the gas estimate
            const tx = await loanRequestPlatformInstance.sendPayment(displayedLoanAddr, {
                from: acct,
                gas: parseInt(gas * 1.2), // safe gas estimate
                value: web3.utils.toWei(payAmt)
            });

            console.log(tx);
            console.log("loan payment success");

            window.location.href = "viewloans.html"

        } catch (err) {
            console.log(err);
            toggleFormSubmit(false);
        }

    },


};

$(window).on("load", function () {

    App.init();

});

