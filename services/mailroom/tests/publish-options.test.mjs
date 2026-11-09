import assert from "node:assert/strict";
import test from "node:test";
import {parsePublicationOptions} from "../publish-options.mjs";

test("publication apply accepts the generated sha256 confirmation flag",()=>{
  const sha="a".repeat(64);
  assert.deepEqual(parsePublicationOptions([
    "--id=verify","--admin-uid=developer-123","--apply",
    "--confirm-revision=3","--confirm-sha256="+sha
  ]),{
    id:"verify","admin-uid":"developer-123",apply:true,
    "confirm-revision":"3","confirm-sha256":sha
  });
});

test("publication options still reject unknown positional input",()=>{
  assert.throws(()=>parsePublicationOptions(["verify"]),/Unknown CLI argument/);
  assert.throws(()=>parsePublicationOptions(["--id=mfa","--admin-uid=developer-123"]),/verify or --id=reset/);
});
