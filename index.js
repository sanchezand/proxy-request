const express = require('express');
const axios = require('axios').default;
const auth = require('basic-auth');
const dotenv = require('dotenv');
const { PassThrough } = require('stream');
dotenv.config();

var app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); 
app.listen(process.env.PORT);

app.use((req, res, next)=>{
	var reqauth = auth(req);
	if(reqauth.name!=process.env.AUTH_USER || reqauth.pass!=process.env.AUTH_PASSWORD){
		return res.sendStatus(403);
	}
	next();
})

app.post('*', async (req, res, next)=>{
	var { data, headers, url, params, method } = req.body;
	if(method==='GET') return next();

	if(params){
		params = new URLSearchParams(params);
	}
	try{
		var res_px = await axios.post(url, data || params, { headers });
		res.status(res_px.status);
		return res.send(res_px.data);
	}catch(e){
		res.status(e && e.response && e.response.status ? e.response.status : 500);
		return res.send(e && e.response && e.response.data ? e.response.data : null);
	}
});

app.get('*', async (req, res)=>{
	var { url } = req.query;
	try{
		var res_px = await axios.get(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/118.0',
				timeout: 5000,
			},
			responseType: 'arraybuffer',
		});

		res.set(res_px.headers);
		if(res_px.status===200 && res_px.data){
			var buff = new PassThrough();
			buff.end(res_px.data);
			buff.pipe(res);
			return;
		}else{
			return res.sendStatus(res_px.status);
		}
	}catch(e){
		res.status(e && e.response && e.response.status ? e.response.status : 500);
		return res.send(e && e.response && e.response.data ? e.response.data : null);
	}
})

app.post('*', (req, res)=>{
	return res.sendStatus(500);
})