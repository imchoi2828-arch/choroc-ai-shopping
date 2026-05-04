from pydantic import BaseModel
from typing import List, Optional

class SignupReq(BaseModel):
    name:     str
    email:    str
    password: str

class LoginReq(BaseModel):
    email:    str
    password: str

class CartAddReq(BaseModel):
    product_id: int
    quantity:   int = 1

class CartUpdateReq(BaseModel):
    quantity: int

class ChatReq(BaseModel):
    message: str
    history: List[dict] = []