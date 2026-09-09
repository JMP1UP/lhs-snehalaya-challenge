import { test } from "node:test";
import assert from "node:assert/strict";
import { searchBooks } from "./catalogue.mjs";

test("successful search encodes only the search term and returns usable edition details", async () => {
  const books = await searchBooks("A&B / stories", async (url, options) => {
    assert.equal(new URL(url).searchParams.get("q"), "A&B / stories");
    assert.equal(options.signal instanceof AbortSignal, true);
    assert.equal(options.body, undefined);
    return {ok:true, json: async () => ({items:[{id:"example",volumeInfo:{title:"Example",authors:["Author"],pageCount:144,publishedDate:"2020",publisher:"Press"}}]})};
  });
  assert.deepEqual(books, [{id:"example",title:"Example",authors:["Author"],pageCount:144,publishedDate:"2020",publisher:"Press"}]);
});

test("missing or malformed optional catalogue fields cannot break the result view", async () => {
  const books = await searchBooks("Example", async () => ({ok:true,json:async()=>({items:[
    null, {volumeInfo:{title:" ",pageCount:300}},
    {id:42,volumeInfo:{title:"Example",authors:{bad:true},publisher:{bad:true},publishedDate:10,pageCount:-100}},
    {id:"two",volumeInfo:{title:"Second",authors:[null,"Author"],pageCount:40000}},
  ]})}));
  assert.equal(books.length, 2);
  assert.deepEqual(books[0], {id:"",title:"Example",authors:[],publisher:"",publishedDate:"",pageCount:undefined});
  assert.deepEqual(books[1].authors, ["Author"]);
  assert.equal(books[1].pageCount, undefined);
});

test("no results returns an empty shelf suggestion list", async () => {
  assert.deepEqual(await searchBooks("Unknown",async()=>({ok:true,json:async()=>({totalItems:0})})), []);
});

test("rate limits, network failure, malformed responses and timeouts reject for manual fallback", async () => {
  await assert.rejects(searchBooks("Example",async()=>({ok:false,status:429})), /unavailable/);
  await assert.rejects(searchBooks("Example",async()=>{throw new TypeError("Offline");}), /Offline/);
  await assert.rejects(searchBooks("Example",async()=>({ok:true,json:async()=>({items:{}})})), /invalid response/);
  await assert.rejects(searchBooks("Example",async()=>({ok:true,json:async()=>{throw new SyntaxError("Bad JSON");}})), /Bad JSON/);
  await assert.rejects(searchBooks("Example",async()=>{throw new DOMException("Timed out", "TimeoutError");}), {name:"TimeoutError"});
});

test("blank search never calls the provider", async () => {
  await assert.rejects(searchBooks("  ", async()=>assert.fail("must not call provider")), /Enter a title/);
});
