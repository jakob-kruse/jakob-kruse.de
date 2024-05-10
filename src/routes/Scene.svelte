<script>
	import { T } from '@threlte/core';
	import { interactivity } from '@threlte/extras';

	interactivity();
	// const scale = spring(1);
	// let rotation = 0;
	// useTask((delta) => {
	// 	rotation += delta;
	// });
</script>

<T.PerspectiveCamera
	makeDefault
	position={[0, 20, 5]}
	on:create={({ ref }) => {
		ref.lookAt(0, 1, 0);
	}}
/>

<T.DirectionalLight position={[0, 10, 10]} castShadow />

<T.Mesh position.y={1} castShadow>
	<T.BoxGeometry args={[1, 2, 1]} />
	<T.MeshStandardMaterial color="white" />
</T.Mesh>

<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
	<T.CircleGeometry args={[4, 40]} />
	<T.MeshStandardMaterial color="black" />
</T.Mesh>
