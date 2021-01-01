# uber-eats-backend


<div align="center">
    <img src="https://camo.githubusercontent.com/5f54c0817521724a2deae8dedf0c280a589fd0aa9bffd7f19fa6254bb52e996a/68747470733a2f2f6e6573746a732e636f6d2f696d672f6c6f676f2d736d616c6c2e737667" logo="nest" width=150 />
</div>
using nest framework and include paddle payments

- Subscription Note :  
  - Pending Order (Onwer) 주인은 주문이 들어오는 것을 실시간 확인 => 주문을 넣으면 publish  
  - Order status (Client) 주문자는 자신의 주문 상태를 실시간 확인 => 주문이 update되면 publish  
  - Pending Pickup Order (Delivery) 운전자는 자신이 pickup 할 수 있는 일거리를 실시간 확인 => 주문이 update되면 publish하되 특정 status인 경우에만(Cooked)  

